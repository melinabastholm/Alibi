(function () {
  const DEFAULT_SELECTORS = Object.freeze({
    viewport: ".viewport",
    root: ".stage-screen",
    dialogPanel: ".dialog-panel",
    dialogText: "#dialog-text",
    speakerName: "#speaker-name",
    choiceList: "#choice-list",
    continueButton: "#continue-button",
    debugPanel: ".debug-panel",
    debugScene: "#debug-scene",
    stateOutput: "#state-output",
    audio: "audio"
  });

  const DEFAULT_DESIGN_SIZE = Object.freeze({
    width: 1440,
    height: 1080
  });

  function copyState(state) {
    return { ...(state || {}) };
  }

  function resolveElement(value, fallbackSelector) {
    const target = value ?? fallbackSelector;

    if (!target) {
      return null;
    }

    if (typeof target === "string") {
      return document.querySelector(target);
    }

    return target;
  }

  function requireElement(element, label) {
    if (!element) {
      throw new Error(`VisualNovelEngine could not find ${label}.`);
    }

    return element;
  }

  function clampChannel(value) {
    return Math.max(0, Math.min(255, Math.round(value)));
  }

  function expandHex(hex) {
    if (hex.length === 4) {
      return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
    }

    return hex;
  }

  function parseHexColor(hex) {
    if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex || "")) {
      return null;
    }

    const normalized = expandHex(hex);

    return {
      r: Number.parseInt(normalized.slice(1, 3), 16),
      g: Number.parseInt(normalized.slice(3, 5), 16),
      b: Number.parseInt(normalized.slice(5, 7), 16)
    };
  }

  function mixColors(base, target, amount) {
    return {
      r: clampChannel(base.r + (target.r - base.r) * amount),
      g: clampChannel(base.g + (target.g - base.g) * amount),
      b: clampChannel(base.b + (target.b - base.b) * amount)
    };
  }

  function rgbString(color, alpha) {
    if (typeof alpha === "number") {
      return `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
    }

    return `rgb(${color.r}, ${color.g}, ${color.b})`;
  }

  class VisualNovelEngine {
    static create(options = {}) {
      return new VisualNovelEngine({
        startSceneId: options.startSceneId,
        viewport: resolveElement(options.viewport, DEFAULT_SELECTORS.viewport),
        root: requireElement(resolveElement(options.root, DEFAULT_SELECTORS.root), "the stage root"),
        dialogPanel: requireElement(resolveElement(options.dialogPanel, DEFAULT_SELECTORS.dialogPanel), "the dialog panel"),
        dialogText: requireElement(resolveElement(options.dialogText, DEFAULT_SELECTORS.dialogText), "the dialog text"),
        speakerName: requireElement(resolveElement(options.speakerName, DEFAULT_SELECTORS.speakerName), "the speaker label"),
        choiceList: requireElement(resolveElement(options.choiceList, DEFAULT_SELECTORS.choiceList), "the choice list"),
        continueButton: requireElement(resolveElement(options.continueButton, DEFAULT_SELECTORS.continueButton), "the continue button"),
        debugPanel: resolveElement(options.debugPanel, DEFAULT_SELECTORS.debugPanel),
        debugScene: resolveElement(options.debugScene, DEFAULT_SELECTORS.debugScene),
        stateOutput: resolveElement(options.stateOutput, DEFAULT_SELECTORS.stateOutput),
        audioElements: Array.from(options.audioElements || document.querySelectorAll(DEFAULT_SELECTORS.audio)),
        initialState: copyState(options.initialState),
        actions: options.actions || {},
        conditions: options.conditions || {},
        designWidth: options.designWidth || DEFAULT_DESIGN_SIZE.width,
        designHeight: options.designHeight || DEFAULT_DESIGN_SIZE.height
      });
    }

    static boot(options = {}) {
      const launch = function () {
        const engine = VisualNovelEngine.create(options);
        const globalName = options.globalName === undefined ? "game" : options.globalName;

        if (globalName) {
          window[globalName] = engine;
        }

        engine.start();
        return engine;
      };

      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", launch, { once: true });
        return null;
      }

      return launch();
    }

    constructor(options) {
      if (!options.startSceneId) {
        throw new Error("VisualNovelEngine requires a startSceneId.");
      }

      this.startSceneId = options.startSceneId;
      this.viewport = options.viewport;
      this.root = options.root;
      this.dialogPanel = options.dialogPanel;
      this.dialogText = options.dialogText;
      this.speakerName = options.speakerName;
      this.choiceList = options.choiceList;
      this.continueButton = options.continueButton;
      this.debugPanel = options.debugPanel;
      this.debugScene = options.debugScene;
      this.stateOutput = options.stateOutput;
      this.audioElements = options.audioElements;
      this.designWidth = options.designWidth;
      this.designHeight = options.designHeight;
      this.initialState = copyState(options.initialState);

      this.state = copyState(this.initialState);
      this.actions = {};
      this.conditions = {};
      this.currentScene = null;
      this.currentSteps = [];
      this.stepIndex = 0;
      this.flowToken = 0;
      this.waitingForClick = false;
      this.imageCache = new Map();

      this.handleContinueClick = this.handleContinueClick.bind(this);
      this.handleDocumentClick = this.handleDocumentClick.bind(this);
      this.handleDocumentKeydown = this.handleDocumentKeydown.bind(this);
      this.updateScale = this.updateScale.bind(this);

      this.registerActions(options.actions);
      this.registerConditions(options.conditions);
      this.bindEvents();
      this.updateDebugPanel();

      if (this.debugPanel) {
        this.debugPanel.open = false;
      }
    }

    bindEvents() {
      this.continueButton.addEventListener("click", this.handleContinueClick);
      document.addEventListener("click", this.handleDocumentClick);
      document.addEventListener("keydown", this.handleDocumentKeydown);
      window.addEventListener("resize", this.updateScale);
    }

    destroy() {
      this.continueButton.removeEventListener("click", this.handleContinueClick);
      document.removeEventListener("click", this.handleDocumentClick);
      document.removeEventListener("keydown", this.handleDocumentKeydown);
      window.removeEventListener("resize", this.updateScale);
    }

    start() {
      this.preloadImages();
      this.updateScale();
      this.goTo(this.startSceneId);
    }

    updateScale() {
      const scale = Math.min(
        window.innerWidth / this.designWidth,
        window.innerHeight / this.designHeight
      );

      document.documentElement.style.setProperty("--scale", String(scale));

      if (this.viewport) {
        this.viewport.style.setProperty("--scale", String(scale));
      }
    }

    setState(updates = {}) {
      this.state = {
        ...this.state,
        ...updates
      };
      this.updateDebugPanel();
      this.refreshConditionalElements();
      return this.state;
    }

    resetState() {
      this.state = copyState(this.initialState);
      this.updateDebugPanel();
      this.refreshConditionalElements();
      return this.state;
    }

    registerAction(name, action) {
      if (typeof action !== "function") {
        throw new TypeError(`Action "${name}" must be a function.`);
      }

      this.actions[name] = action;
      return this;
    }

    registerActions(actions = {}) {
      Object.entries(actions).forEach(([name, action]) => {
        this.registerAction(name, action);
      });
      return this;
    }

    registerCondition(name, condition) {
      if (typeof condition !== "function") {
        throw new TypeError(`Condition "${name}" must be a function.`);
      }

      this.conditions[name] = condition;
      return this;
    }

    registerConditions(conditions = {}) {
      Object.entries(conditions).forEach(([name, condition]) => {
        this.registerCondition(name, condition);
      });
      return this;
    }

    handleContinueClick() {
      if (!this.waitingForClick) {
        return;
      }

      this.waitingForClick = false;
      this.hideContinueButton();
      this.continueScene(this.flowToken);
    }

    handleDocumentClick(event) {
      const runButton = event.target.closest("[data-run]");

      if (!runButton || runButton.closest(".steps")) {
        return;
      }

      if (!this.isInteractiveElementAvailable(runButton)) {
        return;
      }

      this.runAction(runButton.dataset.run, {
        button: runButton,
        element: runButton,
        event
      });

      if (runButton.dataset.next) {
        this.goTo(runButton.dataset.next);
      }
    }

    handleDocumentKeydown(event) {
      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }

      const interactiveElement = event.target.closest("[data-run]");

      if (!interactiveElement || interactiveElement.tagName === "BUTTON") {
        return;
      }

      if (!this.isInteractiveElementAvailable(interactiveElement)) {
        return;
      }

      event.preventDefault();
      interactiveElement.click();
    }

    preloadImage(src) {
      if (!src) {
        return null;
      }

      if (this.imageCache.has(src)) {
        return this.imageCache.get(src);
      }

      const preload = new window.Image();
      preload.src = src;
      this.imageCache.set(src, preload);
      return preload;
    }

    isImageReady(src) {
      const image = this.imageCache.get(src);
      return Boolean(image && image.complete && image.naturalWidth > 0);
    }

    preloadImages() {
      this.root.querySelectorAll("img[src]").forEach((image) => {
        this.preloadImage(image.getAttribute("src"));
      });

      this.root.querySelectorAll('[data-step="swap-image"][data-src]').forEach((step) => {
        this.preloadImage(step.dataset.src);
      });
    }

    clearChoices() {
      this.choiceList.innerHTML = "";
    }

    hideContinueButton() {
      this.continueButton.classList.add("is-hidden");
    }

    showContinueButton() {
      this.continueButton.classList.remove("is-hidden");
    }

    clearActions() {
      this.waitingForClick = false;
      this.hideContinueButton();
      this.clearChoices();
    }

    createChoiceButton(templateButton, step, token) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = templateButton.textContent.trim();

      button.addEventListener("click", () => {
        if (token !== this.flowToken) {
          return;
        }

        if (templateButton.dataset.run) {
          this.runAction(templateButton.dataset.run, {
            button: templateButton,
            sourceStep: step
          });
        }

        if (token !== this.flowToken) {
          return;
        }

        this.clearActions();

        if (templateButton.dataset.next) {
          this.goTo(templateButton.dataset.next);
          return;
        }

        this.continueScene(token);
      });

      return button;
    }

    isInteractiveElementAvailable(element) {
      return Boolean(
        element
        && !element.closest(".steps")
        && !element.hasAttribute("disabled")
        && !element.classList.contains("is-hidden")
      );
    }

    enhanceInteractiveElements(scope = this.currentScene || this.root) {
      if (!scope) {
        return;
      }

      scope.querySelectorAll("[data-run]").forEach((element) => {
        if (element.closest(".steps") || element.tagName === "BUTTON") {
          return;
        }

        if (!element.hasAttribute("tabindex")) {
          element.tabIndex = 0;
        }

        if (!element.hasAttribute("role")) {
          element.setAttribute("role", "button");
        }
      });
    }

    applyDialogColor(hexColor) {
      const color = parseHexColor(hexColor);

      if (!color) {
        this.dialogPanel.style.removeProperty("--dialog-border-color");
        this.dialogPanel.style.removeProperty("--dialog-bg-top");
        this.dialogPanel.style.removeProperty("--dialog-bg-bottom");
        this.dialogPanel.style.removeProperty("--speaker-bg");
        this.dialogPanel.style.removeProperty("--speaker-text");
        return;
      }

      const border = mixColors(color, { r: 24, g: 32, b: 38 }, 0.18);
      const backgroundTop = mixColors(color, { r: 255, g: 255, b: 255 }, 0.9);
      const backgroundBottom = mixColors(color, { r: 245, g: 232, b: 214 }, 0.82);
      const speakerBackground = mixColors(color, { r: 255, g: 255, b: 255 }, 0.78);
      const speakerText = mixColors(color, { r: 24, g: 32, b: 38 }, 0.35);

      this.dialogPanel.style.setProperty("--dialog-border-color", rgbString(border));
      this.dialogPanel.style.setProperty("--dialog-bg-top", rgbString(backgroundTop, 0.96));
      this.dialogPanel.style.setProperty("--dialog-bg-bottom", rgbString(backgroundBottom, 0.98));
      this.dialogPanel.style.setProperty("--speaker-bg", rgbString(speakerBackground, 0.9));
      this.dialogPanel.style.setProperty("--speaker-text", rgbString(speakerText));
    }

    setDialog(speaker, text, hexColor) {
      this.speakerName.textContent = speaker || "";
      this.dialogText.textContent = text || "";
      this.speakerName.classList.toggle("is-hidden", !speaker);
      this.applyDialogColor(hexColor);
    }

    setActiveCharacter(selector) {
      if (!this.currentScene) {
        return;
      }

      this.currentScene.querySelectorAll("[data-char]").forEach((character) => {
        character.classList.remove("active");
      });

      if (!selector) {
        return;
      }

      const activeCharacter = this.currentScene.querySelector(selector);

      if (activeCharacter) {
        activeCharacter.classList.add("active");
      }
    }

    showElement(selector) {
      if (!this.currentScene || !selector) {
        return;
      }

      const element = this.currentScene.querySelector(selector);

      if (element) {
        element.classList.remove("is-hidden");
      }
    }

    hideElement(selector) {
      if (!this.currentScene || !selector) {
        return;
      }

      const element = this.currentScene.querySelector(selector);

      if (element) {
        element.classList.add("is-hidden");
        element.classList.remove("active");
      }
    }

    evaluateCondition(conditionName, element) {
      const condition = this.conditions[conditionName];

      if (typeof condition !== "function") {
        console.warn(`Condition "${conditionName}" was not found.`);
        return false;
      }

      return Boolean(condition(this, { element }));
    }

    updateConditionalElement(element) {
      const visibleIf = element.dataset.visibleIf;
      const visibleIfNot = element.dataset.visibleIfNot;
      let isVisible = true;

      if (visibleIf) {
        isVisible = isVisible && this.evaluateCondition(visibleIf, element);
      }

      if (visibleIfNot) {
        isVisible = isVisible && !this.evaluateCondition(visibleIfNot, element);
      }

      element.classList.toggle("is-hidden", !isVisible);
    }

    refreshConditionalElements(scope = this.currentScene || this.root) {
      if (!scope) {
        return;
      }

      this.enhanceInteractiveElements(scope);

      scope.querySelectorAll("[data-visible-if], [data-visible-if-not]").forEach((element) => {
        this.updateConditionalElement(element);
      });
    }

    swapImage(selector, src, token, duration) {
      if (!this.currentScene || !selector || !src) {
        return false;
      }

      const element = this.currentScene.querySelector(selector);
      const fadeDuration = Number(duration || 220);
      const preload = this.preloadImage(src);

      if (!element || element.tagName !== "IMG") {
        return false;
      }

      const startSwap = () => {
        const clone = element.cloneNode(false);
        const previousTransitionDuration = element.style.transitionDuration;

        clone.removeAttribute("data-char");
        clone.removeAttribute("data-item");
        clone.classList.remove("active");
        clone.classList.add("is-swap-clone");
        clone.style.transitionDuration = `${fadeDuration}ms`;
        element.style.transitionDuration = `${fadeDuration}ms`;

        element.classList.add("is-swapping");
        element.insertAdjacentElement("afterend", clone);
        element.src = src;

        clone.offsetWidth;

        window.requestAnimationFrame(() => {
          if (token !== this.flowToken) {
            element.style.transitionDuration = previousTransitionDuration;
            clone.remove();
            return;
          }

          window.requestAnimationFrame(() => {
            if (token !== this.flowToken) {
              element.style.transitionDuration = previousTransitionDuration;
              clone.remove();
              return;
            }

            clone.classList.add("is-swapping");
            element.classList.remove("is-swapping");
          });
        });

        window.setTimeout(() => {
          clone.remove();
          element.style.transitionDuration = previousTransitionDuration;

          if (token === this.flowToken) {
            this.continueScene(token);
          }
        }, fadeDuration);
      };

      if (this.isImageReady(src)) {
        startSwap();
        return true;
      }

      preload.onload = startSwap;
      preload.onerror = startSwap;
      return true;
    }

    updateDebugPanel() {
      if (this.debugScene) {
        this.debugScene.textContent = this.currentScene ? this.currentScene.id : "none";
      }

      if (this.stateOutput) {
        this.stateOutput.textContent = JSON.stringify(this.state, null, 2);
      }
    }

    stopAllAudio() {
      this.audioElements.forEach((sound) => {
        sound.pause();
        sound.currentTime = 0;
      });
    }

    playAudio(id) {
      const sound = document.getElementById(id);

      if (!sound) {
        return null;
      }

      this.stopAllAudio();
      sound.play().catch(function () {
        return null;
      });
      return sound;
    }

    runAction(actionName, details = {}) {
      const action = this.actions[actionName];

      if (typeof action !== "function") {
        console.warn(`Action "${actionName}" was not found.`);
        return null;
      }

      return action(this, details);
    }

    goTo(sceneId) {
      const nextScene = this.root.querySelector(`#${sceneId}`);

      if (!nextScene) {
        console.warn(`Scene "${sceneId}" was not found.`);
        return;
      }

      this.flowToken += 1;
      this.waitingForClick = false;
      this.clearActions();

      this.root.querySelectorAll(".scene").forEach((scene) => {
        scene.classList.remove("is-active");
      });

      nextScene.classList.add("is-active");
      this.currentScene = nextScene;
      this.currentSteps = Array.from(nextScene.querySelectorAll(".steps [data-step]"));
      this.stepIndex = 0;
      this.refreshConditionalElements(nextScene);
      this.updateDebugPanel();
      this.continueScene(this.flowToken);
    }

    continueScene(token) {
      if (token !== this.flowToken || !this.currentScene) {
        return;
      }

      while (this.stepIndex < this.currentSteps.length) {
        const step = this.currentSteps[this.stepIndex];
        this.stepIndex += 1;

        const outcome = this.executeStep(step, token);

        if (outcome === "pause" || outcome === "scene-changed") {
          return;
        }
      }

      this.clearActions();
    }

    executeStep(step, token) {
      const stepType = step.dataset.step;

      switch (stepType) {
        case "say":
          this.setDialog(step.dataset.speaker, step.textContent.trim(), step.dataset.color);
          return "continue";

        case "focus":
          this.setActiveCharacter(step.dataset.target || "");
          return "continue";

        case "show":
          this.showElement(step.dataset.target);
          return "continue";

        case "hide":
          this.hideElement(step.dataset.target);
          return "continue";

        case "refresh":
          this.refreshConditionalElements();
          return "continue";

        case "swap-image":
          return this.swapImage(step.dataset.target, step.dataset.src, token, step.dataset.duration)
            ? "pause"
            : "continue";

        case "run": {
          const actionResult = this.runAction(step.dataset.action, { step });

          if (typeof actionResult === "string") {
            this.goTo(actionResult);
            return "scene-changed";
          }

          if (token !== this.flowToken) {
            return "scene-changed";
          }

          return "continue";
        }

        case "goto":
          this.goTo(step.dataset.scene);
          return "scene-changed";

        case "wait-click":
          this.clearChoices();
          this.waitingForClick = true;
          this.showContinueButton();
          return "pause";

        case "wait-ms":
          window.setTimeout(() => {
            if (token === this.flowToken) {
              this.continueScene(token);
            }
          }, Number(step.dataset.ms || 0));
          return "pause";

        case "choice":
          this.renderChoices(step, token);
          return "pause";

        default:
          console.warn(`Step type "${stepType}" is not supported.`);
          return "continue";
      }
    }

    renderChoices(step, token) {
      this.clearActions();

      Array.from(step.querySelectorAll("button")).forEach((templateButton) => {
        this.choiceList.appendChild(this.createChoiceButton(templateButton, step, token));
      });
    }
  }

  window.VisualNovelEngine = VisualNovelEngine;
}());
