# server/models/train_knn.py

import os
import pandas as pd
from surprise import Dataset, Reader, KNNWithMeans, accuracy
import joblib

def train_knn_model(
    ratings_path="data/ml-latest/ratings.csv",
    model_path="models/knn_model.pkl",
    k=40,
    sim_name='cosine',
    user_based=False
):
    print(f"Loading ratings from {ratings_path}...")
    df = pd.read_csv(ratings_path)

    reader = Reader(rating_scale=(df.rating.min(), df.rating.max()))
    data = Dataset.load_from_df(df[['userId','movieId','rating']], reader)
    trainset = data.build_full_trainset()

    sim_options = {'name': sim_name, 'user_based': user_based}
    print("Training KNNWithMeans (item-based) ...")
    algo = KNNWithMeans(k=k, sim_options=sim_options)
    algo.fit(trainset)

    print("Evaluating on trainset...")
    testset = trainset.build_testset()
    preds = algo.test(testset)
    print("RMSE:", accuracy.rmse(preds))
    print("MAE: ", accuracy.mae(preds))

    os.makedirs(os.path.dirname(model_path), exist_ok=True)
    joblib.dump(algo, model_path)
    print(f"KNN model saved to {model_path}")

if __name__ == "__main__":
    train_knn_model()
