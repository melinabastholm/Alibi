document.addEventListener("DOMContentLoaded", function () {
  var engine = new window.VisualNovelEngine({
    startSceneId: "intro-scene",
    root: document.querySelector(".stage-screen"),
    dialogText: document.getElementById("dialog-text"),
    speakerName: document.getElementById("speaker-name"),
    choiceList: document.getElementById("choice-list"),
    continueButton: document.getElementById("continue-button"),
    debugScene: document.getElementById("debug-scene"),
    stateOutput: document.getElementById("state-output")
  });

  function resetAudio() {
    document.querySelectorAll("audio").forEach(function (sound) {
      sound.pause();
      sound.currentTime = 0;
    });
  }

  function playSound(id) {
    var sound = document.getElementById(id);

    if (!sound) {
      return;
    }

    resetAudio();
    sound.play().catch(function () {
      return null;
    });
  }

  engine.actions = {
    startStory: function (game) {
      game.resetState();
      game.goTo("intro-scene");
    },
    restartStory: function (game) {
      resetAudio();
      game.resetState();
    },
    chooseSignal: function (game) {
      game.state.investigatedSignal = true;
      game.state.route = "lab";
      game.updateDebugPanel();
    },
    chooseRoof: function (game) {
      game.state.investigatedSignal = false;
      game.state.route = "roof";
      game.state.hasKeycard = false;
      game.updateDebugPanel();
    },
    takeKeycard: function (game) {
      game.state.hasKeycard = true;
      game.updateDebugPanel();
    },
    leaveKeycard: function (game) {
      game.state.hasKeycard = false;
      game.updateDebugPanel();
    },
    helpNoah: function (game) {
      game.state.finalChoice = "helpNoah";
      game.updateDebugPanel();
    },
    helpAva: function (game) {
      game.state.finalChoice = "helpAva";
      game.updateDebugPanel();
    },
    checkEnding: function (game) {
      resetAudio();

      if (game.state.investigatedSignal && game.state.hasKeycard && game.state.finalChoice === "helpNoah") {
        return "clear-ending-scene";
      }

      return "storm-ending-scene";
    },
    playLabTone: function () {
      playSound("sound-lab");
    },
    playEndingTone: function () {
      playSound("sound-ending");
    }
  };

  document.addEventListener("click", function (event) {
    var runButton = event.target.closest("[data-run]");

    if (!runButton) {
      return;
    }

    if (runButton.closest(".steps")) {
      return;
    }

    engine.runAction(runButton.dataset.run, { button: runButton, event: event });

    if (runButton.dataset.next) {
      engine.goTo(runButton.dataset.next);
    }
  });

  window.game = engine;
});
