import json
import os
from datetime import datetime
from typing import List, Dict, Any, Optional
from apify_client import ApifyClient


class LinkedInPostScraper:
    """
    A class to scrape LinkedIn company posts using Apify API
    """
    
    def __init__(self, api_token: str = "<YOUR_API_TOKEN>"):
        """
        Initialize the LinkedIn scraper with Apify API token
        
        Args:
            api_token (str): Your Apify API token
        """
        self.client = ApifyClient(api_token)
        self.actor_id = "mrThmKLmkxJPehxCg"
        
    def scrape_company_posts(
        self, 
        company_urls: List[str],
        limit: int = 10,
        page_number: int = 1,
        sort: str = "recent",
        save_locally: bool = True,
        output_filename: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Scrape posts from LinkedIn company pages
        
        Args:
            company_urls (List[str]): List of LinkedIn company URLs to scrape
            limit (int): Number of posts to retrieve per company (default: 10)
            page_number (int): Page number to start from (default: 1)
            sort (str): Sorting method - "recent" or "top" (default: "recent")
            save_locally (bool): Whether to save results locally (default: True)
            output_filename (str, optional): Custom filename for saved data
            
        Returns:
            List[Dict[str, Any]]: List of post data dictionaries
        """
        all_results = []
        
        try:
            for company_url in company_urls:
                print(f"Scraping company: {company_url}")
                
                # Prepare the Actor input
                run_input = {
                    "company_name": company_url,
                    "limit": limit,
                    "page_number": page_number,
                    "sort": sort
                }
                
                # Run the Actor and wait for it to finish
                run = self.client.actor(self.actor_id).call(run_input=run_input)
                
                # Fetch Actor results from the run's dataset
                company_results = []
                for item in self.client.dataset(run["defaultDatasetId"]).iterate_items():
                    # Extract and format the relevant data
                    post_data = {
                        "activity_urn": item.get("activity_urn", ""),
                        "full_urn": item.get("full_urn", ""),
                        "post_url": item.get("post_url", ""),
                        "text": item.get("text", ""),
                        "posted_at": item.get("posted_at", {}),
                        "post_language_code": item.get("post_language_code", ""),
                        "post_type": item.get("post_type", ""),
                        "author": item.get("author", {}),
                        "stats": item.get("stats", {}),
                        "media": item.get("media", {}),
                        "document": item.get("document", {}),
                        "source_company": item.get("source_company", "")
                    }
                    company_results.append(post_data)
                
                all_results.extend(company_results)
                print(f"Found {len(company_results)} posts for company: {company_url}")
            
            print(f"Total posts scraped: {len(all_results)}")
            
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
            filename = f"linkedin_posts_{timestamp}.json"
        
        # Ensure the filename has .json extension
        if not filename.endswith('.json'):
            filename += '.json'
        
        # Create output directory if it doesn't exist
        output_dir = "linkedin_scraping_results"
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
    
    def get_post_stats(self, results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Get basic statistics from the scraped results
        
        Args:
            results (List[Dict[str, Any]]): Scraped post results
            
        Returns:
            Dict[str, Any]: Statistics dictionary
        """
        if not results:
            return {"total_posts": 0}
        
        total_posts = len(results)
        total_reactions = sum(post.get("stats", {}).get("total_reactions", 0) for post in results)
        total_likes = sum(post.get("stats", {}).get("like", 0) for post in results)
        total_supports = sum(post.get("stats", {}).get("support", 0) for post in results)
        
        # Count posts by type
        post_types = {}
        for post in results:
            post_type = post.get("post_type", "unknown")
            post_types[post_type] = post_types.get(post_type, 0) + 1
        
        # Count posts by language
        languages = {}
        for post in results:
            language = post.get("post_language_code", "unknown")
            languages[language] = languages.get(language, 0) + 1
        
        unique_companies = set(post.get("author", {}).get("name", "") for post in results)
        
        stats = {
            "total_posts": total_posts,
            "unique_companies": len(unique_companies),
            "companies": list(unique_companies),
            "total_reactions": total_reactions,
            "total_likes": total_likes,
            "total_supports": total_supports,
            "post_types": post_types,
            "languages": languages,
            "average_reactions_per_post": round(total_reactions / total_posts, 2) if total_posts > 0 else 0,
            "average_likes_per_post": round(total_likes / total_posts, 2) if total_posts > 0 else 0
        }
        
        return stats


# Example usage and convenience function
def scrape_linkedin_posts(
    company_urls: List[str],
    api_token: str = "<YOUR_API_TOKEN>",
    limit: int = 10,
    page_number: int = 1,
    sort: str = "recent",
    save_locally: bool = True,
    output_filename: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Convenience function to scrape LinkedIn company posts
    
    Args:
        company_urls (List[str]): List of company URLs to scrape
        api_token (str): Apify API token
        limit (int): Number of posts to retrieve per company
        page_number (int): Page number to start from
        sort (str): Sorting method - "recent" or "top"
        save_locally (bool): Whether to save results locally
        output_filename (str, optional): Custom output filename
        
    Returns:
        List[Dict[str, Any]]: Scraped post data
    """
    scraper = LinkedInPostScraper(api_token)
    return scraper.scrape_company_posts(
        company_urls=company_urls,
        limit=limit,
        page_number=page_number,
        sort=sort,
        save_locally=save_locally,
        output_filename=output_filename
    )


if __name__ == "__main__":
    # Example usage
    try:
        # Replace with your actual API token
        API_TOKEN = "apify_api_OwpXbVteuoFNgHZ3gyCWTXjuPxK6rz4omWRn"
        
        # List of company URLs to scrape
        companies_to_scrape = ["https://www.linkedin.com/company/talan-tunisie/posts/?feedView=all"]
        
        # Create scraper instance
        scraper = LinkedInPostScraper(API_TOKEN)
        
        # Scrape company posts
        results = scraper.scrape_company_posts(
            company_urls=companies_to_scrape,
            limit=10,
            page_number=1,
            sort="recent",
            save_locally=True
        )
        
        # Print results in JSON format
        print("\n" + "="*50)
        print("SCRAPED DATA (JSON FORMAT):")
        print("="*50)
        print(json.dumps(results, indent=2, ensure_ascii=False))
        
        # Get and print statistics
        stats = scraper.get_post_stats(results)
        print("\n" + "="*50)
        print("SCRAPING STATISTICS:")
        print("="*50)
        print(json.dumps(stats, indent=2, ensure_ascii=False))
        
    except Exception as e:
        print(f"Error in main execution: {str(e)}")
