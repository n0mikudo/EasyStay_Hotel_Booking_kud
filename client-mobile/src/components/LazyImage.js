/**
 * 懒加载图片组件
 * 使用 loading="lazy" + 占位骨架
 */
import React, { useState } from 'react';
import './LazyImage.css';

function LazyImage({ src, alt, className, fit = 'cover', placeholder }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div className={`lazy-image-wrap ${className || ''}`}>
      {!loaded && !error && (
        <div className="lazy-image-placeholder">
          {placeholder || <span className="lazy-placeholder-icon">🏨</span>}
        </div>
      )}
      {!error && (
        <img
          src={src}
          alt={alt || ''}
          className={`lazy-image-img ${loaded ? 'loaded' : ''}`}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          style={{ objectFit: fit }}
        />
      )}
      {error && (
        <div className="lazy-image-error">
          <span className="lazy-placeholder-icon">🏨</span>
        </div>
      )}
    </div>
  );
}

export default LazyImage;
