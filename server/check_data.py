# server/check_data.py

from models.data_loader import load_ratings
from models.splitter    import train_test_split_df


if __name__ == "__main__":
    df = load_ratings("data/ratings.csv")
    train_df, test_df = train_test_split_df(df)
    print("Всего оценок:", df.shape)
    print("Train:", train_df.shape)
    print("Test: ", test_df.shape)
