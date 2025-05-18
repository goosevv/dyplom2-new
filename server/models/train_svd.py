# server/models/train_svd.py

import os
import pandas as pd
from surprise import Dataset, Reader, SVD, accuracy
import joblib

def train_svd_model(
    ratings_path="data/ml-latest/ratings.csv",
    model_path="models/svd_model.pkl",
    n_factors=50,
    n_epochs=20,
    lr_all=0.005,
    reg_all=0.02
):
    print(f"Loading ratings from {ratings_path}...")
    df = pd.read_csv(ratings_path)

    reader = Reader(rating_scale=(df.rating.min(), df.rating.max()))
    data = Dataset.load_from_df(df[['userId','movieId','rating']], reader)
    trainset = data.build_full_trainset()

    print("Training SVD...")
    algo = SVD(
        n_factors=n_factors,
        n_epochs=n_epochs,
        lr_all=lr_all,
        reg_all=reg_all
    )
    algo.fit(trainset)

    print("Evaluating on trainset...")
    testset = trainset.build_testset()
    preds = algo.test(testset)
    print("RMSE:", accuracy.rmse(preds))
    print("MAE: ", accuracy.mae(preds))

    os.makedirs(os.path.dirname(model_path), exist_ok=True)
    joblib.dump(algo, model_path)
    print(f"SVD model saved to {model_path}")

if __name__ == "__main__":
    train_svd_model()
