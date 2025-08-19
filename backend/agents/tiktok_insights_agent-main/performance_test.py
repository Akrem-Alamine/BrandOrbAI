#!/usr/bin/env python3
"""
Performance testing script for TikTok Engagement Miner

This script demonstrates the performance improvements and provides
recommendations for optimizing association rule mining.
"""

import json
import time
from trend_tiktok import TikTokEngagementMiner

def test_performance():
    """Test performance with different parameter settings"""
    
    # Load data
    try:
        with open("./tiktok_scraping_results/session_670e94d6-0487-4e2f-9de7-edbf738276c2_data.json", "r") as f:
            data = json.load(f)
    except FileNotFoundError:
        print("Data file not found. Please ensure the file exists.")
        return

    print(f"Testing with {len(data)} videos")
    
    # Test 1: Default parameters (slower)
    print("\n=== Test 1: Basic Parameters ===")
    miner1 = TikTokEngagementMiner(
        min_support=0.05,
        min_confidence=0.5,
        min_lift=1.0,
        max_len=4
    )
    
    start = time.time()
    try:
        results1 = miner1.mine_engagement_patterns(data, min_author_frequency=3, min_music_frequency=2)
        time1 = time.time() - start
        print(f"Time: {time1:.2f}s, Rules: {len(results1['rules'])}, Itemsets: {len(results1.get('frequent_itemsets_df', []))}")
    except Exception as e:
        print(f"Error: {e}")
    
    # Test 2: Optimized parameters (faster)
    print("\n=== Test 2: Optimized Parameters ===")
    temp_miner = TikTokEngagementMiner()
    params = temp_miner.optimize_performance(len(data))
    print(f"Recommended params: {params}")
    
    miner2 = TikTokEngagementMiner(
        min_support=params['min_support'],
        min_confidence=params['min_confidence'],
        min_lift=params['min_lift'],
        max_len=params['max_len'],
        max_features_per_category=params['max_features_per_category']
    )
    
    start = time.time()
    try:
        results2 = miner2.mine_engagement_patterns(
            data, 
            min_author_frequency=params['min_author_frequency'],
            min_music_frequency=params['min_music_frequency']
        )
        time2 = time.time() - start
        print(f"Time: {time2:.2f}s, Rules: {len(results2['rules'])}, Itemsets: {len(results2.get('frequent_itemsets_df', []))}")
        
        if 'time1' in locals():
            speedup = time1 / time2
            print(f"Speedup: {speedup:.1f}x faster!")
            
    except Exception as e:
        print(f"Error: {e}")
    
    # Test 3: Sample testing for very large datasets
    if len(data) > 2000:
        print("\n=== Test 3: Sample Testing ===")
        sample_data = TikTokEngagementMiner.create_sample_for_testing(data, 1000)
        
        start = time.time()
        try:
            results3 = miner2.mine_engagement_patterns(sample_data)
            time3 = time.time() - start
            print(f"Sample ({len(sample_data)} videos) - Time: {time3:.2f}s, Rules: {len(results3['rules'])}")
        except Exception as e:
            print(f"Error: {e}")

def print_performance_tips():
    """Print performance optimization tips"""
    print("\n" + "="*60)
    print("PERFORMANCE OPTIMIZATION TIPS")
    print("="*60)
    print("""
1. INCREASE min_support (most important):
   - Higher values = fewer frequent itemsets = faster processing
   - Start with 0.1 (10%) for datasets > 1000 videos
   - Use 0.15+ for datasets > 10000 videos

2. LIMIT max_len (itemset length):
   - Use max_len=2 or 3 for better performance
   - Longer itemsets grow exponentially

3. REDUCE feature count:
   - Increase min_author_frequency, min_music_frequency
   - Limit max_features_per_category
   - Remove rare hashtags

4. INCREASE quality thresholds:
   - Higher min_confidence (0.6+ vs 0.5)
   - Higher min_lift (1.5+ vs 1.0)
   - Fewer but higher quality rules

5. USE SAMPLING for large datasets:
   - Random sample of 1000-5000 videos for testing
   - Full dataset only for final analysis

6. MONITOR memory usage:
   - Binary matrix size = n_videos × n_unique_features
   - Reduce features if memory becomes an issue

Performance scales roughly as:
- O(n_transactions × n_features) for encoding
- O(2^n_features) for itemset generation (worst case)
- Reducing features has the biggest impact!
""")

if __name__ == "__main__":
    test_performance()
    print_performance_tips()
