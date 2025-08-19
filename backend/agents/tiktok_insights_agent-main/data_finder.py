import json
import os
from datetime import datetime
from typing import List, Dict, Any, Optional
from apify_client import ApifyClient


class TikTokProfileScraper:
    """
    A class to scrape TikTok profile videos using Apify API
    """
    
    def __init__(self, api_token: str = "<YOUR_API_TOKEN>"):
        """
        Initialize the TikTok scraper with Apify API token
        
        Args:
            api_token (str): Your Apify API token
        """
        self.client = ApifyClient(api_token)
        self.actor_id = "GdWCkxBtKWOsKjdch"
        
    def scrape_profile_videos(
        self, 
        profile_names: List[str],
        results_per_page: int = 3,
        max_profiles_per_query: int = 1,
        proxy_country_code: str = "TN",
        profile_sorting: str = "latest",
        save_locally: bool = True,
        output_filename: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Scrape videos from TikTok profiles
        
        Args:
            profile_names (List[str]): List of TikTok profile names to scrape
            results_per_page (int): Number of results per page (default: 3)
            max_profiles_per_query (int): Maximum profiles per query (default: 1)
            proxy_country_code (str): Proxy country code (default: "TN")
            profile_sorting (str): Profile sorting method (default: "latest")
            save_locally (bool): Whether to save results locally (default: True)
            output_filename (str, optional): Custom filename for saved data
            
        Returns:
            List[Dict[str, Any]]: List of video data dictionaries
        """
        all_results = []
        
        try:
            for profile_name in profile_names:
                print(f"Scraping profile: {profile_name}")
                
                # Prepare the Actor input
                run_input = {
                    "excludePinnedPosts": False,
                    "maxProfilesPerQuery": max_profiles_per_query,
                    "proxyCountryCode": proxy_country_code,
                    "resultsPerPage": results_per_page,
                    "scrapeRelatedVideos": False,
                    "searchQueries": [profile_name],
                    "searchSection": "/user",
                    "shouldDownloadAvatars": False,
                    "shouldDownloadCovers": False,
                    "shouldDownloadMusicCovers": False,
                    "shouldDownloadSlideshowImages": False,
                    "shouldDownloadSubtitles": False,
                    "shouldDownloadVideos": False,
                    "profileScrapeSections": ["videos"],
                    "profileSorting": profile_sorting
                }
                
                # Run the Actor and wait for it to finish
                run = self.client.actor(self.actor_id).call(run_input=run_input)
                
                # Fetch Actor results from the run's dataset
                profile_results = []
                for item in self.client.dataset(run["defaultDatasetId"]).iterate_items():
                    # Extract and format the relevant data
                    video_data = {
                        "authorMeta.avatar": item.get("authorMeta", {}).get("avatar", ""),
                        "authorMeta.name": item.get("authorMeta", {}).get("name", ""),
                        "text": item.get("text", ""),
                        "diggCount": item.get("diggCount", 0),
                        "shareCount": item.get("shareCount", 0),
                        "playCount": item.get("playCount", 0),
                        "commentCount": item.get("commentCount", 0),
                        "collectCount": item.get("collectCount", 0),
                        "videoMeta.duration": item.get("videoMeta", {}).get("duration", 0),
                        "musicMeta.musicName": item.get("musicMeta", {}).get("musicName", ""),
                        "musicMeta.musicAuthor": item.get("musicMeta", {}).get("musicAuthor", ""),
                        "musicMeta.musicOriginal": item.get("musicMeta", {}).get("musicOriginal", False),
                        "createTimeISO": item.get("createTimeISO", ""),
                        "webVideoUrl": item.get("webVideoUrl", "")
                    }
                    profile_results.append(video_data)
                
                all_results.extend(profile_results)
                print(f"Found {len(profile_results)} videos for profile: {profile_name}")
            
            print(f"Total videos scraped: {len(all_results)}")
            
            # Save locally if requested
            if save_locally:
                self._save_results_locally(all_results, output_filename)
            
            return all_results
            
        except Exception as e:
            print(f"Error occurred while scraping: {str(e)}")
            raise e
    
    def _save_results_locally(self, results: List[Dict[str, Any]], filename: Optional[str] = None) -> str:
        """
        Save results to a local JSON file
        
        Args:
            results (List[Dict[str, Any]]): Results to save
            filename (str, optional): Custom filename
            
        Returns:
            str: Path to the saved file
        """
        if filename is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"tiktok_videos_{timestamp}.json"
        
        # Ensure the filename has .json extension
        if not filename.endswith('.json'):
            filename += '.json'
        
        # Create output directory if it doesn't exist
        output_dir = "tiktok_scraping_results"
        os.makedirs(output_dir, exist_ok=True)
        
        filepath = os.path.join(output_dir, filename)
        
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(results, f, indent=2, ensure_ascii=False)
            
            print(f"Results saved to: {filepath}")
            return filepath
            
        except Exception as e:
            print(f"Error saving results: {str(e)}")
            raise e
    
    def get_profile_stats(self, results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Get basic statistics from the scraped results
        
        Args:
            results (List[Dict[str, Any]]): Scraped video results
            
        Returns:
            Dict[str, Any]: Statistics dictionary
        """
        if not results:
            return {"total_videos": 0}
        
        total_videos = len(results)
        total_likes = sum(video.get("diggCount", 0) for video in results)
        total_shares = sum(video.get("shareCount", 0) for video in results)
        total_plays = sum(video.get("playCount", 0) for video in results)
        total_comments = sum(video.get("commentCount", 0) for video in results)
        
        avg_duration = sum(video.get("videoMeta.duration", 0) for video in results) / total_videos
        
        unique_authors = set(video.get("authorMeta.name", "") for video in results)
        
        stats = {
            "total_videos": total_videos,
            "unique_authors": len(unique_authors),
            "authors": list(unique_authors),
            "total_likes": total_likes,
            "total_shares": total_shares,
            "total_plays": total_plays,
            "total_comments": total_comments,
            "average_duration_seconds": round(avg_duration, 2),
            "average_likes_per_video": round(total_likes / total_videos, 2) if total_videos > 0 else 0,
            "average_plays_per_video": round(total_plays / total_videos, 2) if total_videos > 0 else 0
        }
        
        return stats


# Example usage and convenience function
def scrape_tiktok_profiles(
    profile_names: List[str],
    api_token: str = "<YOUR_API_TOKEN>",
    results_per_page: int = 3,
    save_locally: bool = True,
    output_filename: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Convenience function to scrape TikTok profiles
    
    Args:
        profile_names (List[str]): List of profile names to scrape
        api_token (str): Apify API token
        results_per_page (int): Number of results per page
        save_locally (bool): Whether to save results locally
        output_filename (str, optional): Custom output filename
        
    Returns:
        List[Dict[str, Any]]: Scraped video data
    """
    scraper = TikTokProfileScraper(api_token)
    return scraper.scrape_profile_videos(
        profile_names=profile_names,
        results_per_page=results_per_page,
        save_locally=save_locally,
        output_filename=output_filename
    )


if __name__ == "__main__":
    # Example usage
    try:
        # Replace with your actual API token
        API_TOKEN = "apify_api_OwpXbVteuoFNgHZ3gyCWTXjuPxK6rz4omWRn"
        
        # List of profile names to scrape
        profiles_to_scrape = ["talan_tunisie"]
        
        # Create scraper instance
        scraper = TikTokProfileScraper(API_TOKEN)
        
        # Scrape profiles
        results = scraper.scrape_profile_videos(
            profile_names=profiles_to_scrape,
            results_per_page=50,
            save_locally=True
        )
        
        # Print results in JSON format
        print("\n" + "="*50)
        print("SCRAPED DATA (JSON FORMAT):")
        print("="*50)
        print(json.dumps(results, indent=2, ensure_ascii=False))
        
        # Get and print statistics
        stats = scraper.get_profile_stats(results)
        print("\n" + "="*50)
        print("SCRAPING STATISTICS:")
        print("="*50)
        print(json.dumps(stats, indent=2, ensure_ascii=False))
        
    except Exception as e:
        print(f"Error in main execution: {str(e)}")
