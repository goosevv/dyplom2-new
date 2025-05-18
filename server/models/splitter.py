from sklearn.model_selection import train_test_split

def train_test_split_df(ratings_df, test_size=0.2, random_state=42):
    """
    Разбивает DataFrame оценок на train и test.
    Возвращает два DataFrame: train_df, test_df.
    """
    train_df, test_df = train_test_split(
        ratings_df,
        test_size=test_size,
        random_state=random_state
    )
    return train_df, test_df
