from apify_client import ApifyClient
from typing import List, Optional
import logging

class TikTokProfileSearcher:
    """A class to search for TikTok profiles using Apify."""
    
    def __init__(self, api_token: str):
        """
        Initialize the TikTok profile searcher.
        
        Args:
            api_token (str): Your Apify API token
        """
        self.client = ApifyClient(api_token)
    
    def search_profile(self, search_query: str) -> Optional[str]:
        """
        Search for a TikTok profile and return the profile name.
        
        Args:
            search_query (str): The search query to find the profile
            
        Returns:
            Optional[str]: The profile name if found, None otherwise
        """
        try:
            # Prepare the Actor input
            run_input = {
                "excludePinnedPosts": False,
                "maxProfilesPerQuery": 1,
                "proxyCountryCode": "TN",
                "resultsPerPage": 3,
                "scrapeRelatedVideos": False,
                "searchQueries": [search_query],
                "searchSection": "/user",
                "shouldDownloadAvatars": False,
                "shouldDownloadCovers": False,
                "shouldDownloadMusicCovers": False,
                "shouldDownloadSlideshowImages": False,
                "shouldDownloadSubtitles": False,
                "shouldDownloadVideos": False,
                "profileScrapeSections": ["videos"],
                "profileSorting": "latest"
            }
            
            # Run the Actor and wait for it to finish
            run = self.client.actor("GdWCkxBtKWOsKjdch").call(run_input=run_input)
            
            # Fetch results from the run's dataset
            for item in self.client.dataset(run["defaultDatasetId"]).iterate_items():
                # Extract profile name from the result
                profile_name = item.get("authorMeta.name")
                if profile_name:
                    return profile_name
            
            # If no results found
            return None
            
        except Exception as e:
            logging.error(f"Error searching for TikTok profile '{search_query}': {str(e)}")
            return None
    
    def search_multiple_profiles(self, search_queries: List[str]) -> List[Optional[str]]:
        """
        Search for multiple TikTok profiles and return their profile names.
        
        Args:
            search_queries (List[str]): List of search queries
            
        Returns:
            List[Optional[str]]: List of profile names (None for profiles not found)
        """
        results = []
        for query in search_queries:
            profile_name = self.search_profile(query)
            results.append(profile_name)
        return results


# Convenience function for single profile search
def find_tiktok_profile(api_token: str, search_query: str) -> Optional[str]:
    """
    Convenience function to search for a single TikTok profile.
    
    Args:
        api_token (str): Your Apify API token
        search_query (str): The search query to find the profile
        
    Returns:
        Optional[str]: The profile name if found, None otherwise
    """
    searcher = TikTokProfileSearcher(api_token)
    return searcher.search_profile(search_query)


# Example usage
if __name__ == "__main__":
    # Replace with your actual Apify API token
    API_TOKEN = "apify_api_OwpXbVteuoFNgHZ3gyCWTXjuPxK6rz4omWRn"
    
    # Create searcher instance
    searcher = TikTokProfileSearcher(API_TOKEN)
    
    # Search for a single profile
    profile_name = searcher.search_profile("talan tunisie")
    if profile_name:
        print(f"Found profile: {profile_name}")
    else:
        print("Profile not found")
    
    # Or use the convenience function
    profile_name = find_tiktok_profile(API_TOKEN, "accenture tunisie")
    print(f"Profile name: {profile_name}")
