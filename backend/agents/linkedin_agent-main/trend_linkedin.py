"""
LinkedIn Post Engagement Association Rule Mining Module

This module performs association rule mining on LinkedIn post data to discover
patterns that lead to higher engagement metrics.
"""

import pandas as pd
import numpy as np
from datetime import datetime
from itertools import combinations
from collections import defaultdict
import re
import json
from typing import List, Dict, Tuple, Any
import warnings
from mlxtend.frequent_patterns import apriori, association_rules
from mlxtend.preprocessing import TransactionEncoder

warnings.filterwarnings("ignore")


class LinkedInEngagementMiner:
    """
    Association Rule Mining for LinkedIn engagement analysis
    """

    def __init__(self, min_support=0.1, min_confidence=0.5, min_lift=1.0, max_len=3, 
                 max_features_per_category=50, use_sampling=False, sample_ratio=0.5):
        """
        Initialize the miner with minimum thresholds and performance optimizations

        Args:
            min_support: Minimum support threshold for frequent itemsets (higher = fewer itemsets)
            min_confidence: Minimum confidence threshold for rules
            min_lift: Minimum lift threshold for rules
            max_len: Maximum length of itemsets (lower = better performance) - DEFAULT LOWERED to 3
            max_features_per_category: Maximum number of features per category to include - DEFAULT LOWERED
            use_sampling: Whether to use sampling for very large datasets
            sample_ratio: Ratio of data to sample if use_sampling is True
        """
        self.min_support = min_support
        self.min_confidence = min_confidence
        self.min_lift = min_lift
        self.max_len = max_len
        self.max_features_per_category = max_features_per_category
        self.use_sampling = use_sampling
        self.sample_ratio = sample_ratio
        self.rules = []
        self.frequent_itemsets = {}

        # Define all target variables for LinkedIn posts
        self.target_variables = {
            "high_reactions",
            "high_likes",
            "high_supports", 
            "viral",
            "high_engagement_rate",
            "has_document",
            "has_media",
            "popular_post",
        }

    def preprocess_data(self, data: List[Dict]) -> pd.DataFrame:
        """
        Preprocess LinkedIn data and create features for mining

        Args:
            data: List of LinkedIn post dictionaries

        Returns:
            Processed DataFrame with categorical features
        """
        df = pd.DataFrame(data)

        # Extract time features from posted_at
        df["posted_date"] = pd.to_datetime(df["posted_at"].apply(lambda x: x.get("date", "") if isinstance(x, dict) else ""))
        df["hour"] = df["posted_date"].dt.hour
        df["day_of_week"] = df["posted_date"].dt.day_name()

        # Add weekend indicator
        df["is_weekend"] = df["day_of_week"].isin(["Saturday", "Sunday"])

        # Categorize time periods
        df["time_period"] = df["hour"].apply(self._categorize_time)

        # Extract hashtags from text
        df["hashtags"] = df["text"].apply(self._extract_hashtags)
        df["hashtag_count"] = df["hashtags"].apply(len)

        # Extract mentions from text
        df["mentions"] = df["text"].apply(self._extract_mentions)
        df["mention_count"] = df["mentions"].apply(len)

        # Text length categories
        df["text_length"] = df["text"].fillna("").apply(len)
        df["text_length_category"] = df["text_length"].apply(self._categorize_text_length)

        # Extract author information
        df["author_name"] = df["author"].apply(lambda x: x.get("name", "unknown") if isinstance(x, dict) else "unknown")
        df["author_follower_count"] = df["author"].apply(lambda x: x.get("follower_count", 0) if isinstance(x, dict) else 0)
        df["author_follower_category"] = df["author_follower_count"].apply(self._categorize_followers)

        # Post type and language
        df["post_type"] = df["post_type"].fillna("regular")
        df["post_language"] = df["post_language_code"].fillna("unknown")

        # Extract engagement metrics
        df["total_reactions"] = df["stats"].apply(lambda x: x.get("total_reactions", 0) if isinstance(x, dict) else 0)
        df["like_count"] = df["stats"].apply(lambda x: x.get("like", 0) if isinstance(x, dict) else 0)
        df["support_count"] = df["stats"].apply(lambda x: x.get("support", 0) if isinstance(x, dict) else 0)

        # Calculate engagement rate (assuming follower count as base)
        df["engagement_rate"] = df["total_reactions"] / df["author_follower_count"].replace(0, 1)

        # Media and document indicators
        df["has_media"] = df["media"].apply(lambda x: bool(x) if isinstance(x, dict) else False)
        df["has_document"] = df["document"].apply(lambda x: bool(x.get("url", "")) if isinstance(x, dict) else False)

        # Create composite target variables
        df = self._create_target_variables(df)

        return df

    def _categorize_time(self, hour: int) -> str:
        """Categorize hour into time periods"""
        if 6 <= hour < 12:
            return "morning"
        elif 12 <= hour < 18:
            return "afternoon"
        elif 18 <= hour < 22:
            return "evening"
        else:
            return "night"

    def _categorize_text_length(self, length: int) -> str:
        """Categorize text length"""
        if length <= 100:
            return "short"
        elif length <= 300:
            return "medium"
        elif length <= 600:
            return "long"
        else:
            return "very_long"

    def _categorize_followers(self, follower_count: int) -> str:
        """Categorize follower count"""
        if follower_count <= 1000:
            return "small"
        elif follower_count <= 10000:
            return "medium"
        elif follower_count <= 100000:
            return "large"
        else:
            return "very_large"

    def _extract_mentions(self, text: str) -> List[str]:
        """Extract mentions from text"""
        if pd.isna(text):
            return []
        mentions = re.findall(r"@(\w+)", text.lower())
        return mentions

    def _extract_hashtags(self, text: str) -> List[str]:
        """Extract hashtags from text"""
        if pd.isna(text):
            return []
        hashtags = re.findall(r"#(\w+)", text.lower())
        return hashtags

    def _clean_feature_name(self, name: str) -> str:
        """Clean feature names for use in association rules"""
        if pd.isna(name):
            return "unknown"
        # Convert to lowercase and replace spaces/special chars with underscores
        cleaned = re.sub(r'[^\w\s]', '', str(name).lower())
        cleaned = re.sub(r'\s+', '_', cleaned)
        # Limit length to avoid overly long feature names
        return cleaned[:30] if len(cleaned) > 30 else cleaned

    def _create_target_variables(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create composite engagement target variables for LinkedIn posts"""
        # High reactions (top 25%)
        df["high_reactions"] = df["total_reactions"] >= df["total_reactions"].quantile(0.75)

        # High likes (top 25%)
        df["high_likes"] = df["like_count"] >= df["like_count"].quantile(0.75)

        # High supports (top 25%)
        df["high_supports"] = df["support_count"] >= df["support_count"].quantile(0.75)

        # Viral content (top 10% in total reactions)
        df["viral"] = df["total_reactions"] >= df["total_reactions"].quantile(0.9)

        # High engagement rate (top 25%)
        df["high_engagement_rate"] = df["engagement_rate"] >= df["engagement_rate"].quantile(0.75)

        # Popular posts (combination of high reactions and engagement rate)
        df["popular_post"] = df["high_reactions"] & df["high_engagement_rate"]

        return df

    def create_transactions(self, df: pd.DataFrame, min_author_frequency: int = 5, 
                          min_hashtag_frequency: int = 2) -> List[List[str]]:
        """
        Convert DataFrame to transaction format for association rule mining
        OPTIMIZED: Reduces features by increasing frequency thresholds and limiting items

        Args:
            df: Processed DataFrame
            min_author_frequency: Minimum frequency for author to be included
            min_hashtag_frequency: Minimum frequency for hashtag to be included

        Returns:
            List of transactions (lists of items)
        """
        print("Filtering frequent features for performance...")
        
        # Get frequent authors and hashtags with higher thresholds
        author_counts = df['author_name'].value_counts()
        frequent_authors = set(author_counts[author_counts >= min_author_frequency].index[:self.max_features_per_category])
        
        # Get most frequent hashtags only
        all_hashtags = []
        for hashtags in df['hashtags']:
            all_hashtags.extend(hashtags)
        hashtag_counts = pd.Series(all_hashtags).value_counts()
        frequent_hashtags = set(hashtag_counts[hashtag_counts >= min_hashtag_frequency].index[:self.max_features_per_category])
        
        # Get most frequent mentions
        all_mentions = []
        for mentions in df['mentions']:
            all_mentions.extend(mentions)
        mention_counts = pd.Series(all_mentions).value_counts()
        frequent_mentions = set(mention_counts[mention_counts >= min_hashtag_frequency].index[:self.max_features_per_category])
        
        print(f"Using {len(frequent_authors)} authors, {len(frequent_hashtags)} hashtags, {len(frequent_mentions)} mentions")

        transactions = []

        for _, row in df.iterrows():
            transaction = []

            # Add categorical features (keep these as they're essential)
            transaction.append(f"time_period_{row['time_period']}")
            transaction.append(f"day_{row['day_of_week']}")
            transaction.append(f"text_length_{row['text_length_category']}")
            transaction.append(f"post_type_{row['post_type']}")
            transaction.append(f"language_{row['post_language']}")
            transaction.append(f"follower_category_{row['author_follower_category']}")

            if row["is_weekend"]:
                transaction.append("weekend")
            else:
                transaction.append("weekday")

            # Media and document features
            if row["has_media"]:
                transaction.append("has_media")
            else:
                transaction.append("no_media")
                
            if row["has_document"]:
                transaction.append("has_document")
            else:
                transaction.append("no_document")

            # Simplified hashtag categories
            if row["hashtag_count"] == 0:
                transaction.append("no_hashtags")
            elif row["hashtag_count"] <= 2:
                transaction.append("few_hashtags")
            elif row["hashtag_count"] <= 5:
                transaction.append("moderate_hashtags")
            else:
                transaction.append("many_hashtags")

            # Mention categories
            if row["mention_count"] == 0:
                transaction.append("no_mentions")
            elif row["mention_count"] <= 2:
                transaction.append("few_mentions")
            else:
                transaction.append("many_mentions")

            # Add only frequent hashtags (limit to top 3 per post for performance)
            relevant_hashtags = [h for h in row["hashtags"][:3] if h in frequent_hashtags]
            for hashtag in relevant_hashtags:
                transaction.append(f"hashtag_{hashtag}")

            # Add only frequent mentions (limit to top 2 per post for performance)
            relevant_mentions = [m for m in row["mentions"][:2] if m in frequent_mentions]
            for mention in relevant_mentions:
                transaction.append(f"mention_{mention}")

            # Add author information (only if frequent enough)
            if row["author_name"] in frequent_authors:
                clean_author = self._clean_feature_name(row["author_name"])
                transaction.append(f"author_{clean_author}")

            # Add target variables
            targets = [
                "high_reactions",
                "high_likes", 
                "high_supports",
                "viral",
                "high_engagement_rate",
                "has_document",
                "has_media",
                "popular_post",
            ]

            for target in targets:
                if row[target]:
                    transaction.append(target)

            transactions.append(transaction)

        print(f"Average transaction length: {np.mean([len(t) for t in transactions]):.2f}")
        return transactions

    def find_frequent_itemsets_and_rules(self, transactions: List[List[str]]) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """
        Find frequent itemsets and generate association rules using mlxtend with optimizations
        
        Args:
            transactions: List of transactions
            
        Returns:
            Tuple of (frequent_itemsets, association_rules) DataFrames
        """
        print("Converting transactions to binary matrix...")
        
        # Use TransactionEncoder to convert transactions to binary matrix
        te = TransactionEncoder()
        te_ary = te.fit(transactions).transform(transactions)
        df_encoded = pd.DataFrame(te_ary, columns=te.columns_)
        
        print(f"Binary matrix shape: {df_encoded.shape}")
        print(f"Total unique items: {df_encoded.shape[1]}")
        
        # OPTIMIZATION 1: More aggressive filtering of rare items
        item_support = df_encoded.mean()
        # Use higher threshold than min_support to reduce itemsets significantly
        filter_threshold = max(self.min_support * 1.5, 0.1)  
        frequent_items = item_support[item_support >= filter_threshold].index
        df_encoded_filtered = df_encoded[frequent_items]
        
        print(f"Filtered to {len(frequent_items)} items meeting {filter_threshold:.3f} support threshold")
        
        # OPTIMIZATION 2: If still too many items, keep only the most frequent ones
        if len(frequent_items) > 200:  # Limit total features
            top_items = item_support.nlargest(200).index
            df_encoded_filtered = df_encoded[top_items]
            print(f"Further reduced to top 200 most frequent items")
        
        print("Finding frequent itemsets with mlxtend...")
        
        # OPTIMIZATION 3: Use lower max_len and higher min_support for speed
        # Find frequent itemsets using mlxtend's optimized apriori with strict length limit
        frequent_itemsets = apriori(
            df_encoded_filtered, 
            min_support=self.min_support, 
            use_colnames=True,
            verbose=0,  # Reduce verbosity for speed
            max_len=min(self.max_len, 3),  # Ensure max_len is at most 3
            low_memory=True  # Use low memory mode
        )
        
        if frequent_itemsets.empty:
            print("No frequent itemsets found!")
            return frequent_itemsets, pd.DataFrame()
        
        print(f"Found {len(frequent_itemsets)} frequent itemsets")
        
        # OPTIMIZATION 4: Limit number of itemsets for rule generation
        if len(frequent_itemsets) > 1000:
            # Keep only the most supported itemsets
            frequent_itemsets = frequent_itemsets.nlargest(1000, 'support').reset_index(drop=True)
            print(f"Limited to top 1000 itemsets by support for rule generation")
        
        print("Generating association rules...")
        
        # Generate association rules using mlxtend
        try:
            rules = association_rules(
                frequent_itemsets,
                metric="confidence",
                min_threshold=self.min_confidence,
                num_itemsets=len(frequent_itemsets)
            )
            
            # Filter by lift
            rules = rules[rules['lift'] >= self.min_lift]
            
            # OPTIMIZATION 5: Limit number of rules to prevent memory issues
            if len(rules) > 5000:
                # Keep rules with highest confidence
                rules = rules.nlargest(5000, 'confidence').reset_index(drop=True)
                print(f"Limited to top 5000 rules by confidence")
            
            # Add column for number of antecedents for sorting
            rules['num_antecedents'] = rules['antecedents'].apply(len)
            
            # Sort by confidence (descending) first, then by number of antecedents (descending)
            rules = rules.sort_values(['confidence', 'num_antecedents'], 
                                    ascending=[False, False]).reset_index(drop=True)
            
            print(f"Generated {len(rules)} association rules")
            
        except Exception as e:
            print(f"Error generating rules: {e}")
            rules = pd.DataFrame()
        
        return frequent_itemsets, rules

    def _convert_rules_format(self, rules_df: pd.DataFrame) -> List[Dict]:
        """
        Convert mlxtend rules format to our custom format
        
        Args:
            rules_df: DataFrame from mlxtend association_rules
            
        Returns:
            List of rules in our custom format
        """
        rules_list = []
        
        for _, rule in rules_df.iterrows():
            antecedent = tuple(rule['antecedents'])
            consequent = tuple(rule['consequents'])
            
            rule_dict = {
                "antecedent": antecedent,
                "consequent": consequent,
                "support": rule['support'],
                "confidence": rule['confidence'],
                "lift": rule['lift'],
                "num_antecedents": len(antecedent),
                "rule": f"{' + '.join(antecedent)} => {' + '.join(consequent)}",
            }
            rules_list.append(rule_dict)
        
        return rules_list

    def generate_rules(self, transactions: List[List[str]]) -> List[Dict]:
        """
        Generate association rules using mlxtend (kept for compatibility)
        
        Args:
            transactions: List of transactions
            
        Returns:
            List of association rules
        """
        # Use the new optimized method
        frequent_itemsets, rules_df = self.find_frequent_itemsets_and_rules(transactions)
        
        # Convert to our format and store
        rules = self._convert_rules_format(rules_df)
        self.rules = rules
        
        # Store frequent itemsets in old format for compatibility
        self.frequent_itemsets = self._convert_frequent_itemsets_format(frequent_itemsets)
        
        return rules
    
    def _convert_frequent_itemsets_format(self, frequent_itemsets_df: pd.DataFrame) -> Dict[int, List[Tuple]]:
        """
        Convert mlxtend frequent itemsets format to our custom format
        
        Args:
            frequent_itemsets_df: DataFrame from mlxtend apriori
            
        Returns:
            Dictionary of frequent itemsets by size
        """
        itemsets_by_size = defaultdict(list)
        
        for _, row in frequent_itemsets_df.iterrows():
            itemset = tuple(row['itemsets'])
            size = len(itemset)
            itemsets_by_size[size].append(itemset)
        
        return dict(itemsets_by_size)

    def _calculate_support(self, itemset: Tuple, transactions: List[List[str]]) -> int:
        """Calculate support count for an itemset"""
        count = 0
        itemset_set = set(itemset)
        for transaction in transactions:
            if itemset_set.issubset(set(transaction)):
                count += 1
        return count

    def mine_engagement_patterns(self, data: List[Dict], min_author_frequency: int = 3, 
                                min_hashtag_frequency: int = 2) -> Dict[str, Any]:
        """
        Main method to mine engagement patterns using optimized mlxtend algorithms

        Args:
            data: List of LinkedIn post dictionaries
            min_author_frequency: Minimum frequency for author to be included
            min_hashtag_frequency: Minimum frequency for hashtag to be included

        Returns:
            Dictionary containing analysis results
        """
        print(f"Starting mining for {len(data)} posts...")
        
        # OPTIMIZATION: Use sampling for very large datasets
        original_data_size = len(data)
        if self.use_sampling and len(data) > 2000:
            import random
            sample_size = int(len(data) * self.sample_ratio)
            data = random.sample(data, sample_size)
            print(f"Using sampling: {len(data)} posts (from {original_data_size})")
        
        print("Preprocessing data...")
        df = self.preprocess_data(data)

        print("Creating transactions...")
        transactions = self.create_transactions(df, min_author_frequency, min_hashtag_frequency)
        
        print(f"Created {len(transactions)} transactions")

        print("Finding frequent itemsets and generating rules with mlxtend...")
        # Use the optimized method directly
        frequent_itemsets_df, rules_df = self.find_frequent_itemsets_and_rules(transactions)
        
        # Convert to our format
        rules = self._convert_rules_format(rules_df)
        self.rules = rules
        
        # Store frequent itemsets in old format for compatibility
        frequent_itemsets = self._convert_frequent_itemsets_format(frequent_itemsets_df)
        self.frequent_itemsets = frequent_itemsets

        # Analyze target-specific rules
        target_rules = self._analyze_target_rules(rules)

        return {
            "dataframe": df,
            "transactions": transactions,
            "frequent_itemsets": frequent_itemsets,
            "frequent_itemsets_df": frequent_itemsets_df,  # Also return mlxtend format
            "rules": rules,
            "rules_df": rules_df,  # Also return mlxtend format
            "target_analysis": target_rules,
            "summary": self._generate_summary(df, rules),
            "original_data_size": original_data_size,
            "processed_data_size": len(data)
        }

    def _analyze_target_rules(self, rules: List[Dict]) -> Dict[str, List[Dict]]:
        """Analyze rules by target variable"""
        target_rules = defaultdict(list)

        targets = [
            "high_reactions",
            "high_likes",
            "high_supports",
            "viral",
            "high_engagement_rate",
            "has_document", 
            "has_media",
            "popular_post",
        ]

        for rule in rules:
            for target in targets:
                if any(target in consequent for consequent in rule["consequent"]):
                    target_rules[target].append(rule)

        return dict(target_rules)

    def _generate_summary(self, df: pd.DataFrame, rules: List[Dict]) -> Dict[str, Any]:
        """Generate summary statistics"""
        return {
            "total_posts": len(df),
            "total_rules": len(rules),
            "avg_confidence": np.mean([r["confidence"] for r in rules]) if rules else 0,
            "avg_lift": np.mean([r["lift"] for r in rules]) if rules else 0,
            "top_patterns": rules[:10] if rules else [],
        }

    def get_rules_for_targets(self, targets: List[str], top_n: int = 10) -> List[Dict]:
        """
        Get association rules where the consequent matches exactly the specified targets
        and excludes rules with target variables in the antecedent

        Args:
            targets: List of target variables to match in consequent
            top_n: Number of top rules to return

        Returns:
            List of matching association rules
        """
        target_set = set(targets)
        matching_rules = []

        for rule in self.rules:
            # Check if consequent matches exactly the specified targets
            consequent_set = set(rule["consequent"])
            if consequent_set == target_set:
                # Check that antecedent doesn't contain any target variables
                antecedent_set = set(rule["antecedent"])
                if not antecedent_set.intersection(self.target_variables):
                    matching_rules.append(rule)

        # Sort by confidence (descending) first, then by number of antecedents (descending)
        matching_rules.sort(key=lambda x: (x["confidence"], x["num_antecedents"]), reverse=True)
        
        # Return top N rules
        return matching_rules[:top_n]

    @staticmethod
    def create_sample_for_testing(data: List[Dict], sample_size: int = 1000, 
                                 random_seed: int = 42) -> List[Dict]:
        """
        Create a random sample for testing with large datasets
        
        Args:
            data: Full dataset
            sample_size: Size of sample to create
            random_seed: Random seed for reproducibility
            
        Returns:
            Sampled data
        """
        import random
        random.seed(random_seed)
        
        if len(data) <= sample_size:
            return data
            
        return random.sample(data, sample_size)

    def optimize_performance(self, data_size: int) -> Dict[str, Any]:
        """
        Provide performance optimization recommendations based on data size
        
        Args:
            data_size: Number of transactions/videos
            
        Returns:
            Dictionary with recommended parameters
        """
        if data_size < 500:
            return {
                "min_support": 0.05,
                "min_confidence": 0.5,
                "min_lift": 1.2,
                "max_len": 4,
                "max_features_per_category": 20,
                "min_author_frequency": 2,
                "min_hashtag_frequency": 1,
                "use_sampling": False,
                "sample_ratio": 1.0
            }
        elif data_size < 1000:
            return {
                "min_support": 0.08,
                "min_confidence": 0.6,
                "min_lift": 1.3,
                "max_len": 3,
                "max_features_per_category": 15,
                "min_author_frequency": 3,
                "min_hashtag_frequency": 2,
                "use_sampling": False,
                "sample_ratio": 1.0
            }
        elif data_size < 2000:
            return {
                "min_support": 0.1,
                "min_confidence": 0.6,
                "min_lift": 1.5,
                "max_len": 3,
                "max_features_per_category": 12,
                "min_author_frequency": 4,
                "min_hashtag_frequency": 3,
                "use_sampling": False,
                "sample_ratio": 1.0
            }
        elif data_size < 5000:
            return {
                "min_support": 0.12,
                "min_confidence": 0.65,
                "min_lift": 1.6,
                "max_len": 3,
                "max_features_per_category": 10,
                "min_author_frequency": 5,
                "min_hashtag_frequency": 3,
                "use_sampling": True,
                "sample_ratio": 0.8
            }
        else:  # Very large datasets
            return {
                "min_support": 0.15,
                "min_confidence": 0.7,
                "min_lift": 1.8,
                "max_len": 2,
                "max_features_per_category": 8,
                "min_author_frequency": 8,
                "min_hashtag_frequency": 4,
                "use_sampling": True,
                "sample_ratio": 0.5
            }

# Usage Example
def main():
    """
    Example usage of the LinkedIn Engagement Miner with performance optimizations
    """
    import time
    
    # Load data from JSON file
    try:
        start_time = time.time()
        
        with open(
            "./linkedin_scraping_results/linkedin_posts_20250812_233621.json",
            "r",
            encoding="utf-8",
        ) as f:
            data = json.load(f)

        print(f"Loaded {len(data)} LinkedIn posts")
        
        # Get optimized parameters based on data size
        temp_miner = LinkedInEngagementMiner()
        recommended_params = temp_miner.optimize_performance(len(data))
        print(f"Recommended parameters for {len(data)} posts: {recommended_params}")

        # Initialize the miner with optimized parameters for better performance
        miner = LinkedInEngagementMiner(
            min_support=recommended_params['min_support'],
            min_confidence=recommended_params['min_confidence'],
            min_lift=recommended_params['min_lift'],
            max_len=recommended_params['max_len'],
            max_features_per_category=recommended_params['max_features_per_category'],
            use_sampling=recommended_params['use_sampling'],
            sample_ratio=recommended_params['sample_ratio']
        )

        # Mine engagement patterns with optimized parameters
        print("Starting mining process...")
        mining_start = time.time()
        
        results = miner.mine_engagement_patterns(
            data,
            min_author_frequency=recommended_params['min_author_frequency'],
            min_hashtag_frequency=recommended_params['min_hashtag_frequency']
        )
        
        mining_time = time.time() - mining_start
        total_time = time.time() - start_time
        
        print(f"Mining completed in {mining_time:.2f} seconds (total: {total_time:.2f}s)")
        print(f"Generated {len(results['rules'])} association rules")
        print(f"Found {len(results['frequent_itemsets_df'])} frequent itemsets")

        # Example 1: Get rules for different engagement types
        targets = [
            "high_reactions",
            "high_likes",
            "high_supports",
            "viral",
            "high_engagement_rate",
            "has_document",
            "has_media", 
            "popular_post",
        ]
        for target in targets:
            rules = miner.get_rules_for_targets([target], top_n=5)
            print(f"\nTop 5 rules for {target} content (sorted by confidence, then # antecedents):")
            for i, rule in enumerate(rules, 1):
                print(f"{i}. {rule['rule']}")
                print(
                    f"   Support: {rule['support']:.3f} | Confidence: {rule['confidence']:.3f} | Lift: {rule['lift']:.3f} | Antecedents: {rule['num_antecedents']}"
                )

        # Example 2: Get rules for high reactions AND high likes
        combo_rules = miner.get_rules_for_targets(["high_reactions", "high_likes"], top_n=3)
        print(f"\nTop 3 rules for high reactions AND high likes:")
        for i, rule in enumerate(combo_rules, 1):
            print(f"{i}. {rule['rule']}")
            print(
                f"   Support: {rule['support']:.3f} | Confidence: {rule['confidence']:.3f} | Lift: {rule['lift']:.3f} | Antecedents: {rule['num_antecedents']}"
            )

        # Example 3: Get rules for viral content
        viral_rules = miner.get_rules_for_targets(["viral"], top_n=3)
        print(f"\nTop 3 rules for viral content:")
        for i, rule in enumerate(viral_rules, 1):
            print(f"{i}. {rule['rule']}")
            print(
                f"   Support: {rule['support']:.3f} | Confidence: {rule['confidence']:.3f} | Lift: {rule['lift']:.3f} | Antecedents: {rule['num_antecedents']}"
            )

        return results

    except FileNotFoundError:
        print(
            "Error: Could not find the LinkedIn posts JSON file"
        )
        print("Please make sure you have scraped LinkedIn data first using data_finder.py")
        return None
    except json.JSONDecodeError:
        print("Error: Invalid JSON format in the data file.")
        return None
    except Exception as e:
        print(f"Error: {str(e)}")
        return None


if __name__ == "__main__":
    results = main()
