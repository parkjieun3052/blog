document.addEventListener('DOMContentLoaded', () => {
  const isSettingsPage = window.location.pathname.toLowerCase().endsWith('settings.html');
  document.body.classList.toggle('is-settings-page', isSettingsPage);
  document.body.classList.toggle('is-scroll-page', !isSettingsPage);
  document.body.classList.add('page-ready');

  const triggerPageNavigation = (href) => {
    if (!href || href.startsWith('#')) {
      return;
    }

    document.body.classList.remove('page-ready');
    document.body.classList.add('page-transitioning');

    setTimeout(() => {
      window.location.href = href;
    }, 180);
  };

  document.body.addEventListener('click', (event) => {
    const triggerLink = event.target.closest('[data-post-link]');
    if (triggerLink) {
      event.preventDefault();
      triggerPageNavigation(triggerLink.getAttribute('href'));
      return;
    }

    const navButton = event.target.closest('[data-post-nav]');
    if (navButton) {
      event.preventDefault();
      const targetId = navButton.getAttribute('data-post-nav');
      const targetUrl = targetId === 'list' ? 'view.html' : `view.html?post=${targetId}`;
      triggerPageNavigation(targetUrl);
      return;
    }

    const backButton = event.target.closest('[data-back-action]');
    if (backButton) {
      event.preventDefault();
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = 'view.html';
      }
    }
  });

  const menuContainer = document.getElementById('menu-container');

  if (menuContainer) {
    fetch('menu.html')
      .then((response) => response.text())
      .then((data) => {
        menuContainer.innerHTML = data;

        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const links = menuContainer.querySelectorAll('a');

        links.forEach((link) => {
          const href = link.getAttribute('href');
          if (href === currentPage) {
            link.classList.add('active');
          }
        });
      })
      .catch((error) => {
        console.error('메뉴를 불러오지 못했습니다:', error);
      });
  }

  const defaultImage = 'https://images.unsplash.com/photo-1493246507139-91e8ccbcc934?auto=format&fit=crop&w=1600&q=80';
  const defaultAdminPassword = '1234';

  localStorage.setItem('blogAdminPassword', defaultAdminPassword);

  const hero = document.querySelector('.hero');

  if (hero) {
    const savedImage = localStorage.getItem('blogBgUrl') || defaultImage;
    hero.style.backgroundImage = `linear-gradient(120deg, rgba(20,25,22,0.75), rgba(53,70,55,0.30)), url("${savedImage}")`;
  }

  const adminGate = document.getElementById('adminGate');
  const adminSettings = document.getElementById('adminSettings');
  const adminPasswordInput = document.getElementById('adminPassword');
  const adminLoginBtn = document.getElementById('adminLoginBtn');
  const adminLogoutBtn = document.getElementById('adminLogoutBtn');
  const bgFileInput = document.getElementById('bgFileInput');
  const bgApplyBtn = document.getElementById('bgApplyBtn');
  const passwordChangeBtn = document.getElementById('passwordChangeBtn');
  const newAdminPasswordInput = document.getElementById('newAdminPassword');
  const adminMessage = document.getElementById('adminMessage');
  const settingsMessage = document.getElementById('settingsMessage');
  const myPostList = document.getElementById('myPostList');
  const categoryOptions = document.getElementById('categoryOptions');

  const renderCategoryPicker = (selectedValue = '') => {
    if (!categoryOptions) {
      return;
    }

    const allCategories = getCategoryList();
    const selectedCategory = selectedValue || '일상';
    const categoryInput = document.getElementById('postCategory');

    categoryOptions.innerHTML = allCategories
      .map((category) => `
        <button type="button" class="category-chip ${category === selectedCategory ? 'active' : ''}" data-category-value="${escapeHtml(category)}">
          ${escapeHtml(category)}
        </button>
      `)
      .join('');

    if (categoryInput) {
      categoryInput.value = selectedCategory;
    }

    categoryOptions.querySelectorAll('.category-chip').forEach((button) => {
      button.addEventListener('click', () => {
        const nextValue = button.dataset.categoryValue;
        if (categoryInput) {
          categoryInput.value = nextValue;
        }
        categoryOptions.querySelectorAll('.category-chip').forEach((chip) => {
          chip.classList.toggle('active', chip === button);
        });
      });
    });
  };

  const unlockAdminSettings = () => {
    const savedPassword = localStorage.getItem('blogAdminPassword') || defaultAdminPassword;
    const enteredPassword = adminPasswordInput ? adminPasswordInput.value.trim() : '';

    if (enteredPassword !== savedPassword) {
      if (adminMessage) {
        adminMessage.textContent = '관리자 비밀번호가 일치하지 않습니다.';
      }
      return;
    }

    if (adminGate) {
      adminGate.style.display = 'none';
    }

    if (adminSettings) {
      adminSettings.style.display = 'flex';
    }

    renderMyPostManager();
  };

  if (adminLoginBtn) {
    adminLoginBtn.addEventListener('click', unlockAdminSettings);
  }

  if (adminPasswordInput) {
    adminPasswordInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        unlockAdminSettings();
      }
    });
  }

  if (adminLogoutBtn) {
    adminLogoutBtn.addEventListener('click', () => {
      if (adminGate) {
        adminGate.style.display = 'flex';
      }
      if (adminSettings) {
        adminSettings.style.display = 'none';
      }
      if (adminPasswordInput) {
        adminPasswordInput.value = '';
      }
      if (adminMessage) {
        adminMessage.textContent = '로그아웃되었습니다.';
      }
    });
  }

  if (bgApplyBtn) {
    bgApplyBtn.addEventListener('click', async () => {
      let imageUrl = localStorage.getItem('blogBgUrl') || defaultImage;

      if (bgFileInput && bgFileInput.files && bgFileInput.files[0]) {
        imageUrl = await readFileAsDataUrl(bgFileInput.files[0]);
      }

      localStorage.setItem('blogBgUrl', imageUrl);

      const homeHero = document.querySelector('.hero');
      if (homeHero) {
        homeHero.style.backgroundImage = `linear-gradient(120deg, rgba(20,25,22,0.75), rgba(53,70,55,0.30)), url("${imageUrl}")`;
      }

      if (settingsMessage) {
        settingsMessage.textContent = '홈 배경이 저장되었습니다.';
      }
    });
  }

  if (passwordChangeBtn) {
    passwordChangeBtn.addEventListener('click', () => {
      const newPassword = newAdminPasswordInput ? newAdminPasswordInput.value.trim() : '';

      if (!newPassword) {
        if (settingsMessage) {
          settingsMessage.textContent = '새 비밀번호를 입력해 주세요.';
        }
        return;
      }

      localStorage.setItem('blogAdminPassword', newPassword);
      if (newAdminPasswordInput) {
        newAdminPasswordInput.value = '';
      }

      if (settingsMessage) {
        settingsMessage.textContent = '관리자 비밀번호가 변경되었습니다.';
      }

      renderMyPostManager();
    });
  }

  if (myPostList) {
    myPostList.addEventListener('click', (event) => {
      const actionButton = event.target.closest('[data-admin-action]');
      if (!actionButton) {
        return;
      }

      const action = actionButton.dataset.adminAction;
      const id = Number(actionButton.dataset.id);

      if (action === 'edit') {
        window.location.href = `settings.html?edit=${id}`;
        return;
      }

      if (action === 'delete') {
        const shouldDelete = window.confirm('이 글을 삭제할까요?');
        if (!shouldDelete) {
          return;
        }

        const updatedPosts = getPosts().filter((post) => String(post.id) !== String(id));
        localStorage.setItem('blogPosts', JSON.stringify(updatedPosts));
        renderMyPostManager();
      }
    });
  }

  const popularPosts = document.getElementById('popularPosts');
  const latestPosts = document.getElementById('latestPosts');

  if (popularPosts || latestPosts) {
    renderHomePostSection();
  }

  const aboutPage = document.getElementById('aboutPageContent');
  if (aboutPage) {
    renderAboutPage();
  }

  const aboutHomePreview = document.getElementById('aboutHomePreview');
  if (aboutHomePreview) {
    const settings = getAboutSettings();
    const title = escapeHtml(settings.title || '나의 하루를 사진으로 남기는 공간');
    const intro = formatMultilineText(settings.intro || '');
    const mainImage = settings.mainImage || 'https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?auto=format&fit=crop&w=1200&q=80';
    const secondaryImage = settings.secondaryImage || 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80';

    aboutHomePreview.innerHTML = `
      <div class="about-preview-shell">
        <div class="about-preview-copy">
          <div class="about-preview-kicker">Creative Studio</div>
          <h3>${title}</h3>
          <p>${intro}</p>
        </div>
        <div class="about-preview-gallery">
          <img src="${mainImage}" alt="${title}" />
          <img src="${secondaryImage}" alt="${title} 보조 이미지" />
        </div>
      </div>
    `;
  }

  const aboutEditorForm = document.getElementById('aboutEditorForm');
  if (aboutEditorForm) {
    const aboutSettings = getAboutSettings();
    const aboutTitleInput = document.getElementById('aboutTitleInput');
    const aboutIntroInput = document.getElementById('aboutIntroInput');

    if (aboutTitleInput) aboutTitleInput.value = aboutSettings.title;
    if (aboutIntroInput) aboutIntroInput.value = aboutSettings.intro;

    aboutEditorForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const title = document.getElementById('aboutTitleInput')?.value.trim() || aboutSettings.title;
      const intro = document.getElementById('aboutIntroInput')?.value.trim() || aboutSettings.intro;
      const mainImageInput = document.getElementById('aboutMainImageInput');
      const secondaryImageInput = document.getElementById('aboutSecondaryImageInput');
      const saveStatus = document.getElementById('aboutStatus');
      const nextSettings = {
        ...aboutSettings,
        title,
        intro
      };

      if (mainImageInput && mainImageInput.files && mainImageInput.files[0]) {
        nextSettings.mainImage = await readFileAsDataUrl(mainImageInput.files[0]);
      }
      if (secondaryImageInput && secondaryImageInput.files && secondaryImageInput.files[0]) {
        nextSettings.secondaryImage = await readFileAsDataUrl(secondaryImageInput.files[0]);
      }

      localStorage.setItem('blogAboutSettings', JSON.stringify(nextSettings));

      if (saveStatus) {
        saveStatus.textContent = '블로그 소개가 저장되었습니다.';
      }

      if (typeof renderAboutPage === 'function') {
        renderAboutPage();
      }
    });
  }

  const postForm = document.getElementById('postForm');
  const handwritePanel = document.getElementById('handwritePanel');
  const toggleHandwriteMode = document.getElementById('toggleHandwriteMode');
  const handwriteCanvas = document.getElementById('handwriteCanvas');
  const saveHandwriteBtn = document.getElementById('saveHandwriteBtn');
  const clearHandwriteBtn = document.getElementById('clearHandwriteBtn');
  const postSketch = document.getElementById('postSketch');
  const scrapbookImageInput = document.getElementById('scrapbookImage');
  const eraserToolBtn = document.getElementById('eraserToolBtn');
  const colorSwatches = document.querySelectorAll('.color-swatch');
  const stickerButtons = document.querySelectorAll('.sticker-btn');
  let activeImageLayer = null;
  let imageLayers = [];

  const exportHandwriteCanvas = async () => {
    if (!handwriteCanvas) {
      return '';
    }

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = handwriteCanvas.width;
    tempCanvas.height = handwriteCanvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    const sourceImage = new Image();
    sourceImage.src = handwriteCanvas.toDataURL('image/png');
    await sourceImage.decode().catch(() => undefined);
    tempCtx.drawImage(sourceImage, 0, 0, tempCanvas.width, tempCanvas.height);

    for (const layer of imageLayers) {
      const image = new Image();
      image.src = layer.src;
      await image.decode().catch(() => undefined);
      tempCtx.drawImage(image, layer.x, layer.y, layer.width, layer.height);
    }

    return tempCanvas.toDataURL('image/png');
  };

  const loadCanvasFromImage = (dataUrl) => {
    if (!handwriteCanvas || !dataUrl) {
      return;
    }

    const ctx = handwriteCanvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, handwriteCanvas.width, handwriteCanvas.height);
      ctx.drawImage(img, 0, 0, handwriteCanvas.width, handwriteCanvas.height);
    };
    img.src = dataUrl;
  };

  if (handwriteCanvas) {
    const ctx = handwriteCanvas.getContext('2d');
    let isDrawing = false;
    let lastPoint = null;
    let activeColor = '#2f1d1a';
    let isErasing = false;
    let activeSticker = '';

    const canvasContainer = handwriteCanvas.parentElement;
    const canvasShell = document.createElement('div');
    canvasShell.className = 'handwrite-canvas-shell';
    const imageLayerHost = document.createElement('div');
    imageLayerHost.className = 'handwrite-image-layer-host';

    if (canvasContainer) {
      canvasContainer.insertBefore(canvasShell, handwriteCanvas);
      canvasShell.appendChild(handwriteCanvas);
      canvasShell.appendChild(imageLayerHost);
    }

    const syncLayerStyle = (layer, item) => {
      const rect = handwriteCanvas.getBoundingClientRect();
      const left = (item.x / handwriteCanvas.width) * rect.width;
      const top = (item.y / handwriteCanvas.height) * rect.height;
      const width = (item.width / handwriteCanvas.width) * rect.width;
      const height = (item.height / handwriteCanvas.height) * rect.height;
      layer.style.left = `${left}px`;
      layer.style.top = `${top}px`;
      layer.style.width = `${width}px`;
      layer.style.height = `${height}px`;
    };

    const registerImageLayer = (src) => {
      const layer = document.createElement('div');
      layer.className = 'handwrite-image-layer';
      const image = document.createElement('img');
      image.src = src;
      image.alt = '사진 스크랩';
      const resizeHandle = document.createElement('span');
      resizeHandle.className = 'resize-handle';
      layer.appendChild(image);
      layer.appendChild(resizeHandle);

      const layerState = {
        src,
        x: 180,
        y: 70,
        width: 220,
        height: 160
      };

      imageLayers.push(layerState);
      syncLayerStyle(layer, layerState);
      imageLayerHost.appendChild(layer);

      layer.addEventListener('pointerdown', (event) => {
        const handleTarget = event.target.closest('.resize-handle');
        const index = imageLayers.indexOf(layerState);
        activeImageLayer = {
          index,
          mode: handleTarget ? 'resize' : 'move',
          startX: event.clientX,
          startY: event.clientY,
          originX: layerState.x,
          originY: layerState.y,
          originWidth: layerState.width,
          originHeight: layerState.height
        };
        event.preventDefault();
      });

      return layer;
    };

    const renderImageLayers = () => {
      imageLayerHost.innerHTML = '';
      imageLayers.forEach((layer) => {
        const item = document.createElement('div');
        item.className = 'handwrite-image-layer';
        const image = document.createElement('img');
        image.src = layer.src;
        image.alt = '사진 스크랩';
        const resizeHandle = document.createElement('span');
        resizeHandle.className = 'resize-handle';
        item.appendChild(image);
        item.appendChild(resizeHandle);
        syncLayerStyle(item, layer);
        item.addEventListener('pointerdown', (event) => {
          const handleTarget = event.target.closest('.resize-handle');
          const index = imageLayers.indexOf(layer);
          activeImageLayer = {
            index,
            mode: handleTarget ? 'resize' : 'move',
            startX: event.clientX,
            startY: event.clientY,
            originX: layer.x,
            originY: layer.y,
            originWidth: layer.width,
            originHeight: layer.height
          };
          event.preventDefault();
        });
        imageLayerHost.appendChild(item);
      });
    };

    const loadCanvasFromImage = (dataUrl) => {
      if (!dataUrl) {
        return;
      }

      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, handwriteCanvas.width, handwriteCanvas.height);
        ctx.drawImage(img, 0, 0, handwriteCanvas.width, handwriteCanvas.height);
      };
      img.src = dataUrl;
    };

    const drawBackground = () => {
      ctx.clearRect(0, 0, handwriteCanvas.width, handwriteCanvas.height);
      ctx.fillStyle = '#fffdf9';
      ctx.fillRect(0, 0, handwriteCanvas.width, handwriteCanvas.height);
      ctx.strokeStyle = activeColor;
      ctx.lineWidth = isErasing ? 18 : 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    };

    drawBackground();

    const getPointerPosition = (event) => {
      const rect = handwriteCanvas.getBoundingClientRect();
      return {
        x: ((event.clientX - rect.left) / rect.width) * handwriteCanvas.width,
        y: ((event.clientY - rect.top) / rect.height) * handwriteCanvas.height
      };
    };

    colorSwatches.forEach((swatch) => {
      swatch.addEventListener('click', () => {
        activeColor = swatch.dataset.color;
        isErasing = false;
        if (eraserToolBtn) {
          eraserToolBtn.textContent = '지우개';
        }
        colorSwatches.forEach((button) => button.classList.toggle('active', button === swatch));
      });
    });

    if (eraserToolBtn) {
      eraserToolBtn.addEventListener('click', () => {
        isErasing = !isErasing;
        eraserToolBtn.textContent = isErasing ? '펜 모드' : '지우개';
        if (isErasing) {
          activeSticker = '';
        }
      });
    }

    stickerButtons.forEach((button) => {
      button.addEventListener('click', () => {
        activeSticker = activeSticker === button.dataset.sticker ? '' : button.dataset.sticker;
        isErasing = false;
        if (eraserToolBtn) {
          eraserToolBtn.textContent = '지우개';
        }
      });
    });

    handwriteCanvas.addEventListener('pointerdown', (event) => {
      const point = getPointerPosition(event);

      if (activeSticker) {
        ctx.font = '48px "Nanum Pen Script", cursive';
        ctx.fillStyle = activeColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(activeSticker, point.x, point.y);
        return;
      }

      isDrawing = true;
      lastPoint = point;
      if (isErasing) {
        ctx.strokeStyle = '#fffdf9';
        ctx.lineWidth = 18;
      } else {
        ctx.strokeStyle = activeColor;
        ctx.lineWidth = 3;
      }
    });

    handwriteCanvas.addEventListener('pointermove', (event) => {
      if (!isDrawing || !lastPoint || activeSticker) {
        return;
      }
      const point = getPointerPosition(event);
      ctx.beginPath();
      ctx.moveTo(lastPoint.x, lastPoint.y);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
      lastPoint = point;
    });

    handwriteCanvas.addEventListener('pointerup', () => {
      isDrawing = false;
      lastPoint = null;
    });

    handwriteCanvas.addEventListener('pointerleave', () => {
      isDrawing = false;
      lastPoint = null;
    });

    handwritePanel.addEventListener('pointermove', (event) => {
      if (!activeImageLayer) {
        return;
      }

      const layer = imageLayers[activeImageLayer.index];
      if (!layer) {
        return;
      }

      const xDelta = (event.clientX - activeImageLayer.startX) / handwriteCanvas.clientWidth * handwriteCanvas.width;
      const yDelta = (event.clientY - activeImageLayer.startY) / handwriteCanvas.clientHeight * handwriteCanvas.height;

      if (activeImageLayer.mode === 'move') {
        layer.x = Math.min(Math.max(activeImageLayer.originX + xDelta, 0), handwriteCanvas.width - layer.width);
        layer.y = Math.min(Math.max(activeImageLayer.originY + yDelta, 0), handwriteCanvas.height - layer.height);
      } else {
        const nextWidth = Math.max(60, activeImageLayer.originWidth + xDelta);
        const nextHeight = Math.max(60, activeImageLayer.originHeight + yDelta);
        layer.width = Math.min(nextWidth, handwriteCanvas.width - layer.x);
        layer.height = Math.min(nextHeight, handwriteCanvas.height - layer.y);
      }

      const targetLayer = imageLayerHost.querySelectorAll('.handwrite-image-layer')[activeImageLayer.index];
      if (targetLayer) {
        syncLayerStyle(targetLayer, layer);
      }
    });

    handwritePanel.addEventListener('pointerup', () => {
      activeImageLayer = null;
    });

    handwritePanel.addEventListener('pointerleave', () => {
      activeImageLayer = null;
    });

    if (scrapbookImageInput) {
      scrapbookImageInput.addEventListener('change', async (event) => {
        const file = event.target.files && event.target.files[0];
        if (!file) {
          return;
        }
        const imageData = await readFileAsDataUrl(file);
        const layer = registerImageLayer(imageData);
        syncLayerStyle(layer, imageLayers[imageLayers.length - 1]);
      });
    }

    if (clearHandwriteBtn) {
      clearHandwriteBtn.addEventListener('click', () => {
        drawBackground();
        imageLayers = [];
        renderImageLayers();
        if (postSketch) {
          postSketch.value = '';
        }
      });
    }

    if (saveHandwriteBtn) {
      saveHandwriteBtn.addEventListener('click', async () => {
        if (postSketch) {
          postSketch.value = await exportHandwriteCanvas();
        }
        if (document.getElementById('saveStatus')) {
          document.getElementById('saveStatus').textContent = '손글씨 메모가 저장되었습니다.';
        }
      });
    }

  }

  if (toggleHandwriteMode && handwritePanel) {
    toggleHandwriteMode.addEventListener('click', () => {
      const isVisible = handwritePanel.style.display !== 'none';
      handwritePanel.style.display = isVisible ? 'none' : 'block';
      toggleHandwriteMode.textContent = isVisible ? '손글씨 메모 모드' : '손글씨 메모 닫기';
    });
  }

  if (postForm) {
    const postIdField = document.getElementById('postId');
    const params = new URLSearchParams(window.location.search);
    const editingId = params.get('edit');
    const writerDetails = postForm.closest('details');

    if (editingId) {
      const posts = getPosts();
      const target = posts.find((post) => String(post.id) === editingId);
      const titleEl = document.getElementById('postTitle');
      const categoryEl = document.getElementById('postCategory');
      const contentEl = document.getElementById('postContent');
      const pageTitle = document.querySelector('.page-title');
      const submitButton = document.querySelector('#postForm button[type="submit"]');

      if (target && titleEl && categoryEl && contentEl && pageTitle && submitButton) {
        if (writerDetails) {
          writerDetails.open = true;
        }
        postIdField.value = String(target.id);
        titleEl.value = target.title;
        categoryEl.value = target.category || '';
        contentEl.value = target.content;
        if (target.handwriting) {
          loadCanvasFromImage(target.handwriting);
        }
        renderCategoryPicker(target.category || '일상');
        pageTitle.textContent = '글 수정';
        submitButton.textContent = '수정하기';
      }
    } else {
      renderCategoryPicker('일상');
    }

    postForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const handwritingNote = handwriteCanvas && postSketch
        ? await exportHandwriteCanvas()
        : (postSketch && postSketch.value ? postSketch.value : '');

      if (postSketch) {
        postSketch.value = handwritingNote;
      }

      const title = document.getElementById('postTitle').value.trim();
      const category = document.getElementById('postCategory').value.trim() || '일상';
      const content = document.getElementById('postContent').value.trim();
      const imageInput = document.getElementById('postImage');
      const statusText = document.getElementById('saveStatus');
      const postId = postIdField ? postIdField.value : '';

      if (!title || (!content && !handwritingNote)) {
        statusText.textContent = '제목과 내용을 모두 입력해 주세요.';
        return;
      }

      let image = '';
      if (imageInput && imageInput.files && imageInput.files[0]) {
        image = await readFileAsDataUrl(imageInput.files[0]);
      }

      let scrapbookImage = '';
      if (scrapbookImageInput && scrapbookImageInput.files && scrapbookImageInput.files[0] && !handwritingNote) {
        scrapbookImage = await readFileAsDataUrl(scrapbookImageInput.files[0]);
      }

      const posts = getPosts();

      if (postId) {
        const index = posts.findIndex((post) => String(post.id) === String(postId));
        if (index >= 0) {
          posts[index] = {
            ...posts[index],
            title,
            category: category || '일상',
            content,
            image: image || posts[index].image || '',
            scrapbookImage: scrapbookImage || posts[index].scrapbookImage || '',
            handwriting: handwritingNote || posts[index].handwriting || '',
            updatedAt: new Date().toISOString()
          };
        }
      } else {
        posts.unshift({
          id: Date.now(),
          title,
          category: category || '일상',
          content,
          image,
          scrapbookImage,
          handwriting: handwritingNote,
          createdAt: new Date().toISOString()
        });
      }

      localStorage.setItem('blogPosts', JSON.stringify(posts));
      statusText.textContent = '저장되었습니다! 글 목록을 확인해 보세요.';
      postForm.reset();
      if (postIdField) {
        postIdField.value = '';
      }
      if (postSketch) {
        postSketch.value = '';
      }
      if (handwritePanel) {
        handwritePanel.style.display = 'none';
      }
      if (toggleHandwriteMode) {
        toggleHandwriteMode.textContent = '손글씨 메모 모드';
      }

      setTimeout(() => {
        window.location.href = 'view.html';
      }, 600);
    });
  }

  const postList = document.getElementById('postList');
  const categoryFilters = document.getElementById('categoryFilters');

  const setCategoryNavigationVisibility = (visible) => {
    if (categoryFilters) {
      categoryFilters.style.display = visible ? '' : 'none';
    }

    const navWrap = categoryFilters ? categoryFilters.closest('.category-nav-wrap') : null;
    if (navWrap) {
      navWrap.style.display = visible ? '' : 'none';
    }
  };

  if (postList) {
    const params = new URLSearchParams(window.location.search);
    const selectedPostId = params.get('post');
    const selectedCategory = params.get('category') || 'all';
    let posts = getPosts();

    if (categoryFilters) {
      categoryFilters.innerHTML = renderCategoryFilters(selectedCategory);
      categoryFilters.addEventListener('click', (event) => {
        const target = event.target.closest('[data-filter-category]');
        if (!target) {
          return;
        }

        const nextCategory = target.dataset.filterCategory;
        const url = new URL(window.location.href);
        if (nextCategory === 'all') {
          url.searchParams.delete('category');
        } else {
          url.searchParams.set('category', nextCategory);
        }
        window.location.href = url.toString();
      });
    }

    if (!posts.length) {
      setCategoryNavigationVisibility(true);
      postList.innerHTML = '<div class="empty-state">아직 저장된 글이 없습니다. 첫 번째 글을 작성해 보세요.</div>';
    } else if (selectedPostId) {
      setCategoryNavigationVisibility(false);
      const targetIndex = posts.findIndex((post) => String(post.id) === selectedPostId);
      const target = posts[targetIndex];
      if (!target) {
        window.location.href = 'view.html';
        return;
      }

      posts = posts.map((post, index) => {
        if (index === targetIndex) {
          return { ...post, views: Number(post.views || 0) + 1 };
        }
        return post;
      });
      localStorage.setItem('blogPosts', JSON.stringify(posts));
      const detailPost = posts[targetIndex];
      postList.innerHTML = renderPostDetail(detailPost);
    } else {
      setCategoryNavigationVisibility(true);
      const filteredPosts = selectedCategory === 'all'
        ? posts
        : posts.filter((post) => (post.category || '일상') === selectedCategory);

      postList.innerHTML = filteredPosts.length
        ? filteredPosts.map((post) => renderPostSummary(post)).join('')
        : '<div class="empty-state">이 카테고리에 작성된 글이 없습니다.</div>';
    }

  }
});

function renderMyPostManager() {
  if (!document.getElementById('myPostList')) {
    return;
  }

  const myPostList = document.getElementById('myPostList');
  const posts = getPosts();

  if (!posts.length) {
    myPostList.innerHTML = '<div class="empty-state">작성한 글이 아직 없습니다.</div>';
    return;
  }

  myPostList.innerHTML = posts
    .map((post) => {
      const safeTitle = escapeHtml(post.title || '제목 없음');
      return `
        <div class="admin-post-item">
          <div class="admin-post-title">${safeTitle}</div>
          <div class="admin-post-actions">
            <button class="action-btn" type="button" data-admin-action="edit" data-id="${post.id}">수정</button>
            <button class="action-btn danger" type="button" data-admin-action="delete" data-id="${post.id}">삭제</button>
          </div>
        </div>
      `;
    })
    .join('');
}

function getPosts() {
  return JSON.parse(localStorage.getItem('blogPosts') || '[]');
}

function getAboutSettings() {
  const defaults = {
    title: '나의 하루를 사진으로 남기는 공간',
    intro: '이 블로그는 내가 좋아하는 순간을 사진과 글로 남기는 작은 기록장입니다.',
    body: '여행, 일상, 감정이 머무는 장소를 천천히 바라보며 남기는 기록입니다. 매일의 작은 풍경도 기억으로 남기고 싶어서, 사진과 글을 함께 정리하는 공간을 만들었습니다.',
    mainImage: 'https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?auto=format&fit=crop&w=1200&q=80',
    secondaryImage: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80'
  };

  try {
    const stored = JSON.parse(localStorage.getItem('blogAboutSettings') || 'null');
    return stored ? { ...defaults, ...stored } : defaults;
  } catch (error) {
    return defaults;
  }
}

function renderAboutPage() {
  const root = document.getElementById('aboutPageContent');
  if (!root) {
    return;
  }

  const settings = getAboutSettings();
  const title = escapeHtml(settings.title || '나의 하루를 사진으로 남기는 공간');
  const intro = formatMultilineText(settings.intro || '');
  const mainImage = settings.mainImage || 'https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?auto=format&fit=crop&w=1200&q=80';
  const secondaryImage = settings.secondaryImage || 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80';

  root.innerHTML = `
    <header class="editorial-header">
      <div class="brand-wrap">
        <span class="studio-brand">Creative Studio</span>
      </div>
    </header>

    <div class="editorial-body">
      <div class="editorial-title-wrap">
        <div class="title-arrow">→</div>
        <h1 class="editorial-title">${title}</h1>
      </div>

      <div class="editorial-copy editorial-copy-simple">
        <p class="about-intro-text">${intro}</p>
      </div>

      <div class="editorial-gallery editorial-gallery-simple">
        <figure class="photo-card photo-large">
          <img src="${mainImage}" alt="${title}" />
        </figure>

        <figure class="photo-card photo-portrait">
          <img src="${secondaryImage}" alt="${title} 보조 이미지" />
        </figure>
      </div>
    </div>
  `;
}

function getCategoryList() {
  const posts = getPosts();
  const categories = posts
    .map((post) => (post.category || '일상').trim())
    .filter(Boolean);
  const uniqueCategories = [...new Set(categories)];
  return uniqueCategories.length ? uniqueCategories : ['일상'];
}

function renderCategoryFilters(selectedCategory = 'all') {
  const categories = getCategoryList();
  const filters = ['all', ...categories];

  return `
    <div class="category-filter-list">
      ${filters.map((category) => {
        const label = category === 'all' ? '전체' : category;
        const activeClass = selectedCategory === category ? 'active' : '';
        return `<button type="button" class="category-filter ${activeClass}" data-filter-category="${category}">${label}</button>`;
      }).join('')}
    </div>
  `;
}

function renderHomePostSection() {
  const popularPosts = document.getElementById('popularPosts');
  const latestPosts = document.getElementById('latestPosts');

  if (!popularPosts && !latestPosts) {
    return;
  }

  const posts = getPosts();
  const popular = [...posts]
    .sort((a, b) => Number(b.views || 0) - Number(a.views || 0) || new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 3);
  const latest = [...posts]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 3);

  if (popularPosts) {
    popularPosts.innerHTML = popular.length
      ? popular.map(createHomeCardMarkup).join('')
      : '<div class="empty-state">아직 인기글이 없습니다.</div>';
  }

  if (latestPosts) {
    latestPosts.innerHTML = latest.length
      ? latest.map(createHomeCardMarkup).join('')
      : '<div class="empty-state">아직 최신글이 없습니다.</div>';
  }
}

function createHomeCardMarkup(post) {
  const safeTitle = escapeHtml(post.title || '제목 없음');
  const safeCategory = escapeHtml(post.category || '일상');
  const safeSummary = escapeHtml(getSummaryText(post.content || ''));
  const dateText = new Date(post.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
  const image = post.image
    ? `<div class="card-thumb" style="background-image: url('${post.image}');"></div>`
    : '<div class="card-thumb placeholder" aria-label="사진 영역">Photo</div>';

  return `
    <article class="card">
      <a class="card-link" href="view.html?post=${post.id}" data-post-link>
        ${image}
        <div class="card-body">
          <div class="card-meta">
            <span class="card-tag">${safeCategory}</span>
            <span class="card-views">조회수 ${Number(post.views || 0)}</span>
          </div>
          <h3>${safeTitle}</h3>
          <p>${safeSummary}</p>
          <div class="post-meta" style="margin-top:12px;">${dateText}</div>
        </div>
      </a>
    </article>
  `;
}

function renderPostSummary(post) {
  const safeTitle = escapeHtml(post.title);
  const safeCategory = escapeHtml(post.category || '일상');
  const previewText = getSummaryText(post.content);
  const dateText = new Date(post.createdAt).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const safeImage = post.image
    ? `<div class="post-visual"><img src="${post.image}" alt="${safeTitle}"></div>`
    : '<div class="post-visual placeholder" aria-label="사진 영역"><span>Photo</span></div>';

  return `
    <article class="post-card post-summary">
      <a href="view.html?post=${post.id}" class="card-link" data-post-link>
        ${safeImage}
        <div class="post-body">
          <div class="post-header">
            <span class="card-tag">${safeCategory}</span>
            <span class="post-meta">${dateText}</span>
          </div>
          <h2 class="post-title">${safeTitle}</h2>
          <p class="post-preview">${escapeHtml(previewText)}</p>
        </div>
      </a>
    </article>
  `;
}

function renderPostDetail(post) {
  const safeTitle = escapeHtml(post.title);
  const safeCategory = escapeHtml(post.category || '일상');
  const dateText = new Date(post.createdAt).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const safeImage = post.image ? `<img src="${post.image}" alt="${safeTitle}">` : '';
  const handwritingMarkup = post.handwriting
    ? `<div class="note-paper"><img src="${post.handwriting}" alt="손글씨 메모"></div>`
    : '';
  const scrapbookMarkup = post.scrapbookImage && !post.handwriting
    ? `<div class="scrapbook-frame"><img src="${post.scrapbookImage}" alt="사진 스크랩"></div>`
    : '';
  const noteCollage = (scrapbookMarkup || handwritingMarkup)
    ? `<div class="note-collage">${scrapbookMarkup}${handwritingMarkup}</div>`
    : '';
  const contentMarkup = post.content
    ? `<div class="post-content">${formatContentParagraphs(post.content)}</div>`
    : '';

  return `
    <article class="post-card">
      <div class="post-detail-header">
        <div class="post-detail-bar">
          <div class="left-tools">
            <span class="card-tag">${safeCategory}</span>
            <span class="post-meta">${dateText}</span>
          </div>
          <div class="right-tools">
            <button type="button" class="ghost-btn" data-back-action="list">목록으로</button>
          </div>
        </div>
      </div>

      <h2 class="post-title">${safeTitle}</h2>
      ${safeImage}
      ${noteCollage}
      ${contentMarkup}
    </article>
  `;
}

function formatContentParagraphs(content) {
  const normalized = String(content || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const paragraphs = normalized
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  if (!paragraphs.length) {
    return `<p class="post-content-paragraph">${escapeHtml(normalized)}</p>`;
  }

  return paragraphs
    .map((paragraph) => `<p class="post-content-paragraph">${escapeHtml(paragraph)}</p>`)
    .join('');
}

function formatMultilineText(value) {
  const normalized = String(value || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  return normalized
    .split('\n')
    .map((line) => escapeHtml(line))
    .join('<br>');
}

function getSummaryText(content) {
  const text = (content || '').replace(/\s+/g, ' ').trim();
  return text.length > 110 ? text.slice(0, 110) + '...' : text;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('이미지 읽기 실패'));
    reader.readAsDataURL(file);
  });
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (match) => {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    return map[match];
  });
}
