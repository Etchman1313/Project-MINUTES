/**
 * THE ARCHIVE — Application Entry
 * Visual Milestone 01 · The Arrival
 * Visual Milestone 02 · The Record
 *
 * Modular structure within a single file.
 * No global variables.
 */

(function () {
  'use strict';

  /** @type {MediaQueryList} */
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const TIMING = {
    silence: 2000,
    typeSpeed: 85,
    pauseAfterType: 1400,
    fade: 700,
    messageHold: 2200,
    loaderExit: 1200,
    heroSettle: 3200,
    epigraphReveal: 2200,
    epigraphPause: 1400,
    titleReveal: 2000,
  };

  const MESSAGES = [
    { type: 'type', text: 'AUTHENTICATING REQUEST...' },
    { type: 'show', text: 'RECORD GROUP 12\nACCESS LEVEL\nPUBLIC RELEASE' },
    { type: 'show', text: 'EMERGENCY CONTINUATION AUTHORITY\nSTATUS\nACTIVE' },
    { type: 'show', text: 'DAY 2557' },
  ];


  /* --------------------------------------------------------------------------
     Scroll Lock
     -------------------------------------------------------------------------- */

  const ScrollLock = {
    lock() {
      document.body.classList.add('is-scroll-locked');
      document.body.classList.remove('is-arrival-complete');
    },

    unlock() {
      document.body.classList.remove('is-scroll-locked');
      document.body.classList.add('is-arrival-complete');
    },
  };


  /* --------------------------------------------------------------------------
     Utilities
     -------------------------------------------------------------------------- */

  /**
   * @param {number} ms
   * @returns {Promise<void>}
   */
  function wait(ms) {
    return new Promise(function (resolve) {
      window.setTimeout(resolve, ms);
    });
  }

  /**
   * @param {string} text
   * @param {number} speed
   * @returns {Promise<void>}
   */
  function typeText(text, speed) {
    const target = document.getElementById('loader-text');
    const srStatus = document.getElementById('loader-sr-status');

    if (!target) {
      return Promise.resolve();
    }

    target.textContent = '';

    return new Promise(function (resolve) {
      let index = 0;

      function step() {
        if (index < text.length) {
          target.textContent += text.charAt(index);
          if (srStatus) {
            srStatus.textContent = target.textContent;
          }
          index += 1;
          window.setTimeout(step, speed);
        } else {
          resolve();
        }
      }

      step();
    });
  }

  /**
   * @param {HTMLElement} line
   * @returns {Promise<void>}
   */
  function fadeLine(line) {
    line.classList.add('is-fading');
    return wait(TIMING.fade);
  }


  /* --------------------------------------------------------------------------
     Loader Sequence
     -------------------------------------------------------------------------- */

  const Loader = {
    /**
     * @returns {HTMLElement | null}
     */
    getElement() {
      return document.getElementById('archive-loader');
    },

    /**
     * @returns {HTMLElement | null}
     */
    getLine() {
      const loader = this.getElement();
      return loader ? loader.querySelector('.archive-loader__line') : null;
    },

    activate() {
      const loader = this.getElement();
      if (loader) {
        loader.classList.add('is-active');
      }
    },

    async runSequence() {
      const loader = this.getElement();
      const line = this.getLine();
      const textEl = document.getElementById('loader-text');

      if (!loader || !line || !textEl) {
        return;
      }

      await wait(TIMING.silence);
      this.activate();

      for (let i = 0; i < MESSAGES.length; i += 1) {
        const message = MESSAGES[i];
        line.classList.remove('is-fading');
        textEl.textContent = '';

        if (message.type === 'type') {
          await typeText(message.text, TIMING.typeSpeed);
          await wait(TIMING.pauseAfterType);
        } else {
          textEl.textContent = message.text;
          const srStatus = document.getElementById('loader-sr-status');
          if (srStatus) {
            srStatus.textContent = message.text.replace('\n', '. ');
          }
          await wait(TIMING.messageHold);
        }

        if (i < MESSAGES.length - 1) {
          await fadeLine(line);
        }
      }

      await wait(TIMING.pauseAfterType);
      loader.classList.add('is-exiting');
      await wait(TIMING.loaderExit);
      loader.classList.add('is-complete');
      loader.classList.remove('is-active');
    },

    skip() {
      const loader = this.getElement();
      if (loader) {
        loader.classList.add('is-complete');
        loader.classList.remove('is-active');
      }
    },
  };


  /* --------------------------------------------------------------------------
     Hero Reveal
     -------------------------------------------------------------------------- */

  const Hero = {
    /**
     * @returns {HTMLElement | null}
     */
    getElement() {
      return document.getElementById('arrival-hero');
    },

    async reveal() {
      const hero = this.getElement();
      if (!hero) {
        return;
      }

      hero.classList.add('is-revealed');
      await wait(TIMING.heroSettle);
      hero.classList.add('is-settled');
      await wait(TIMING.epigraphReveal + TIMING.epigraphPause);
      hero.classList.add('is-title-visible');
      await wait(TIMING.titleReveal);
    },

    showFinalState() {
      const hero = this.getElement();
      if (!hero) {
        return;
      }

      hero.classList.add('is-revealed', 'is-settled', 'is-title-visible');
    },
  };


  /* --------------------------------------------------------------------------
     Audio Hooks
     Custom events for future sound design. No audio loaded.
     -------------------------------------------------------------------------- */

  const AudioHooks = {
    /**
     * @param {string} type
     * @param {Record<string, unknown>} detail
     */
    emit(type, detail) {
      document.dispatchEvent(new CustomEvent('archive:' + type, {
        bubbles: true,
        detail: detail,
      }));
    },

    /**
     * @param {HTMLElement} folder
     * @param {'open' | 'close'} action
     */
    folder(folder, action) {
      this.emit('folder', { action: action, folder: folder });
    },

    /**
     * @param {HTMLElement} folder
     */
    paper(folder) {
      this.emit('paper', { action: 'slide', folder: folder });
    },

    /**
     * @param {HTMLElement} folder
     */
    stamp(folder) {
      this.emit('stamp', { action: 'impress', folder: folder });
    },

    /**
     * @param {HTMLElement} folder
     */
    drawer(folder) {
      this.emit('drawer', { action: 'open', folder: folder });
    },
  };


  /* --------------------------------------------------------------------------
     Archive Folder
     -------------------------------------------------------------------------- */

  const Folder = {
    /** @type {HTMLElement | null} */
    activeFolder: null,

    init() {
      const folders = document.querySelectorAll('[data-archive-folder]');

      folders.forEach(function (folderEl) {
        Folder.bind(folderEl);
      });

      document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && Folder.activeFolder) {
          event.preventDefault();
          Folder.close(Folder.activeFolder);
        }
      });
    },

    /**
     * @param {HTMLElement} folderEl
     */
    bind(folderEl) {
      const control = folderEl.querySelector('.archive-folder__cover');
      const documentEl = folderEl.querySelector('.archive-folder__document');
      const desk = folderEl.closest('.record-desk');

      if (!control || !documentEl) {
        return;
      }

      control.addEventListener('click', function () {
        if (folderEl.classList.contains('is-open')) {
          Folder.close(folderEl);
        } else {
          Folder.open(folderEl);
        }
      });

      if (desk) {
        desk.addEventListener('click', function (event) {
          if (
            folderEl.classList.contains('is-open') &&
            !folderEl.contains(event.target)
          ) {
            Folder.close(folderEl);
          }
        });
      }
    },

    /**
     * @param {HTMLElement} folderEl
     */
    open(folderEl) {
      const control = folderEl.querySelector('.archive-folder__cover');
      const documentEl = folderEl.querySelector('.archive-folder__document');

      if (!control || !documentEl || folderEl.classList.contains('is-open')) {
        return;
      }

      if (Folder.activeFolder && Folder.activeFolder !== folderEl) {
        Folder.close(Folder.activeFolder);
      }

      folderEl.classList.add('is-open');
      control.setAttribute('aria-expanded', 'true');
      documentEl.setAttribute('aria-hidden', 'false');
      Folder.activeFolder = folderEl;

      AudioHooks.drawer(folderEl);
      AudioHooks.folder(folderEl, 'open');
      AudioHooks.stamp(folderEl);

      window.setTimeout(function () {
        AudioHooks.paper(folderEl);
        documentEl.focus();
      }, reducedMotion.matches ? 0 : 600);
    },

    /**
     * @param {HTMLElement} folderEl
     */
    close(folderEl) {
      const control = folderEl.querySelector('.archive-folder__cover');
      const documentEl = folderEl.querySelector('.archive-folder__document');

      if (!control || !documentEl || !folderEl.classList.contains('is-open')) {
        return;
      }

      folderEl.classList.remove('is-open');
      control.setAttribute('aria-expanded', 'false');
      documentEl.setAttribute('aria-hidden', 'true');
      control.focus();

      if (Folder.activeFolder === folderEl) {
        Folder.activeFolder = null;
      }

      AudioHooks.folder(folderEl, 'close');
      AudioHooks.paper(folderEl);
    },
  };


  /* --------------------------------------------------------------------------
     Arrival Orchestration
     -------------------------------------------------------------------------- */

  const Arrival = {
    async init() {
      ScrollLock.lock();

      if (reducedMotion.matches) {
        this.showFinalState();
        return;
      }

      reducedMotion.addEventListener('change', function (event) {
        if (event.matches) {
          Arrival.showFinalState();
        }
      });

      await Loader.runSequence();
      await Hero.reveal();
      ScrollLock.unlock();
    },

    showFinalState() {
      Loader.skip();
      Hero.showFinalState();
      ScrollLock.unlock();
    },
  };


  document.addEventListener('DOMContentLoaded', function () {
    Arrival.init();
    Folder.init();
  });
})();
