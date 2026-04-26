(function () {
  const GOOD_ENDING_SCENE_ID = "garden-good-ending-scene";
  const BAD_ENDING_SCENE_ID = "garden-bad-ending-scene";

  // Add more story-specific helpers and actions here as the game grows.
  const storyConditions = {
    shouldShowMug(game) {
      return !game.state.pickedUpMug;
    }
  };

  const storyActions = {
    restartStory(game) {
      game.stopAllAudio();
      game.resetState();
    },

    packBackpack(game) {
      game.setState({
        broughtBackpack: true,
        travelStyle: "prepared"
      });
    },

    travelLight(game) {
      game.setState({
        broughtBackpack: false,
        travelStyle: "light"
      });
    },

    helpAlex(game) {
      game.setState({
        helpedAlex: true,
        recoveredNotepad: true
      });
    },

    rushAhead(game) {
      game.setState({
        helpedAlex: false,
        recoveredNotepad: false
      });
    },

    pickUpMug(game) {
      if (game.state.pickedUpMug) {
        return;
      }

      game.setState({
        pickedUpMug: true
      });
      game.setDialog("Abigail", "I should bring the mug too.", "#79b8f9");
    },

    checkEnding(game) {
      const endingSceneId = game.state.broughtBackpack && game.state.helpedAlex
          ? GOOD_ENDING_SCENE_ID
          : BAD_ENDING_SCENE_ID;

      game.stopAllAudio();
      game.setState({
        ending: endingSceneId === GOOD_ENDING_SCENE_ID ? "good" : "rough"
      });

      return endingSceneId;
    },

    playSceneTone(game) {
      game.playAudio("sound-lab");
    },

    playEndingTone(game) {
      game.playAudio("sound-ending");
    }
  };

  window.VisualNovelEngine.boot({
    startSceneId: "intro-scene",
    initialState: {
      broughtBackpack: false,
      travelStyle: null,
      helpedAlex: false,
      recoveredNotepad: false,
      pickedUpMug: false,
      ending: null
    },
    conditions: storyConditions,
    actions: storyActions
  });
}());
