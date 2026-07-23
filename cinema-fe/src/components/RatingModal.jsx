import React, { useState, useEffect } from "react";
import "./RatingModal.css";
import { fetchReviewsByMovie, postMovieReview, computeAccurateRating } from "../services/reviewService";

const RATING_LABELS = {
  10: "10/10 - Siêu phẩm xuất sắc! 🏆",
  9: "9/10 - Rất hay, đáng xem! 🔥",
  8: "8/10 - Phim hay! 👍",
  7: "7/10 - Khá tốt! 🙂",
  6: "6/10 - Xem được 👌",
  5: "5/10 - Trung bình 😐",
  4: "4/10 - Yếu 👎",
  3: "3/10 - Tệ 🙁",
  2: "2/2 - Rất tệ 😡",
  1: "1/10 - Quá dở 🤮",
};

export default function RatingModal({ movie, onClose, onRatingUpdated }) {
  const movieId = movie?.id ?? movie?.movieId ?? movie?.Id ?? movie?.MovieId;
  const movieTitle = movie?.title ?? movie?.Title ?? movie?.name ?? "Phim";
  const posterUrl = movie?.posterUrl ?? movie?.PosterUrl ?? movie?.imageUrl ?? "/img/no-image.png";

  const [rating, setRating] = useState(10);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const savedUser = (() => {
    try {
      const u = localStorage.getItem("user");
      return u ? JSON.parse(u) : null;
    } catch (e) {
      return null;
    }
  })();

  const userId = savedUser?.userId || savedUser?.UserId || 1;
  const userName = savedUser?.fullName || savedUser?.FullName || savedUser?.email || "Khách hàng";

  useEffect(() => {
    if (movieId) {
      loadReviews();
    }
  }, [movieId]);

  async function loadReviews() {
    const list = await fetchReviewsByMovie(movieId);
    setReviews(list);
  }

  const handleStarClick = (score) => {
    setRating(score);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      await postMovieReview({
        movieId,
        rating,
        comment,
        userId,
        userName,
      });

      setSuccessMsg("Gửi đánh giá thành công! Cảm ơn bạn đã đóng góp ý kiến.");
      setComment("");
      await loadReviews();
      if (onRatingUpdated) onRatingUpdated(movieId);

      setTimeout(() => {
        setSuccessMsg("");
      }, 3000);
    } catch (err) {
      setErrorMsg("Không thể gửi đánh giá. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  const defaultBase = parseFloat((8.0 + (movieId % 17) / 10).toFixed(1));
  const stats = computeAccurateRating(movieId, defaultBase);

  return (
    <div className="rm-overlay" onClick={onClose}>
      <div className="rm-card" onClick={(e) => e.stopPropagation()}>
        <button className="rm-close-btn" onClick={onClose}>
          ✕
        </button>

        <div className="rm-header">
          <img src={posterUrl} alt={movieTitle} className="rm-poster" />
          <div className="rm-header-info">
            <span className="rm-tag">ĐÁNH GIÁ PHIM</span>
            <h3 className="rm-title">{movieTitle}</h3>
            <div className="rm-score-badge">
              <span className="rm-star-icon">★</span>
              <span className="rm-score-val">{stats.avgRating}</span>
              <span className="rm-score-max">/ 10</span>
              <span className="rm-count">({stats.count} lượt đánh giá)</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="rm-form">
          <label className="rm-form-label">Chọn điểm số của bạn:</label>
          <div className="rm-stars-row" onMouseLeave={() => setHoverRating(0)}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => {
              const active = star <= (hoverRating || rating);
              return (
                <button
                  key={star}
                  type="button"
                  className={`rm-star-btn ${active ? "active" : ""}`}
                  onMouseEnter={() => setHoverRating(star)}
                  onClick={() => handleStarClick(star)}
                >
                  ★
                </button>
              );
            })}
          </div>

          <div className="rm-rating-desc">
            {RATING_LABELS[hoverRating || rating]}
          </div>

          <div className="rm-field">
            <textarea
              className="rm-textarea"
              placeholder="Viết nhận xét của bạn về nội dung, diễn xuất, kỹ xảo..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
          </div>

          {successMsg && <div className="rm-msg success">{successMsg}</div>}
          {errorMsg && <div className="rm-msg error">{errorMsg}</div>}

          <button type="submit" className="rm-submit-btn" disabled={loading}>
            {loading ? "Đang gửi..." : "GỬI ĐÁNH GIÁ NGAY"}
          </button>
        </form>

        {reviews.length > 0 && (
          <div className="rm-reviews-section">
            <h4 className="rm-reviews-title">Đánh giá từ khán giả ({reviews.length})</h4>
            <div className="rm-reviews-list">
              {reviews.map((rev, idx) => (
                <div key={rev.reviewId || idx} className="rm-review-item">
                  <div className="rm-review-head">
                    <span className="rm-user-name">{rev.userName || rev.user?.fullName || `Khán giả #${rev.userId || idx + 1}`}</span>
                    <span className="rm-review-score">★ {rev.rating}/10</span>
                  </div>
                  {rev.comment && <p className="rm-review-comment">{rev.comment}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
