document.addEventListener('DOMContentLoaded', function () {
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  // Gallery lightbox. Each thumbnail's own <img alt> is reused as the
  // full-size caption, so the two never drift out of sync.
  var galleryButtons = Array.prototype.slice.call(document.querySelectorAll('#gallery-grid button'));
  if (!galleryButtons.length) return;

  var photos = galleryButtons.map(function (button) {
    var thumb = button.querySelector('img');
    var base = thumb.getAttribute('src').replace(/-480\.jpg$/, '');
    return { src: base + '-1200.jpg', alt: thumb.getAttribute('alt') };
  });

  var lightbox = document.getElementById('lightbox');
  var lightboxImage = document.getElementById('lightbox-image');
  var lightboxCaption = document.getElementById('lightbox-caption');
  var closeBtn = document.getElementById('lightbox-close');
  var prevBtn = document.getElementById('lightbox-prev');
  var nextBtn = document.getElementById('lightbox-next');
  var currentIndex = 0;
  var lastFocused = null;

  function showPhoto(index) {
    currentIndex = (index + photos.length) % photos.length;
    var photo = photos[currentIndex];
    lightboxImage.src = photo.src;
    lightboxImage.alt = photo.alt;
    lightboxCaption.textContent = photo.alt;
  }

  function openLightbox(index) {
    lastFocused = document.activeElement;
    showPhoto(index);
    lightbox.hidden = false;
    closeBtn.focus();
    document.addEventListener('keydown', onKeydown);
  }

  function closeLightbox() {
    lightbox.hidden = true;
    document.removeEventListener('keydown', onKeydown);
    if (lastFocused) lastFocused.focus();
  }

  function onKeydown(event) {
    if (event.key === 'Escape') closeLightbox();
    if (event.key === 'ArrowLeft') showPhoto(currentIndex - 1);
    if (event.key === 'ArrowRight') showPhoto(currentIndex + 1);
  }

  galleryButtons.forEach(function (button, index) {
    button.addEventListener('click', function () { openLightbox(index); });
  });
  closeBtn.addEventListener('click', closeLightbox);
  prevBtn.addEventListener('click', function () { showPhoto(currentIndex - 1); });
  nextBtn.addEventListener('click', function () { showPhoto(currentIndex + 1); });
  lightbox.addEventListener('click', function (event) {
    if (event.target === lightbox) closeLightbox();
  });
});
