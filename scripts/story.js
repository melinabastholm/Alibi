// @ts-check

import { VisualNovelEngine } from './engine.js';

/**
 * Single source of truth for story-specific state fields.
 * Add new values here when your story needs to remember
 * stats, clues, items, or which conversations already happened.
 */
const storyInitialState = {
  statTrust: 0,
  statFocus: 0,
  itemHasKnife: false,
  storyCheckedHandprint: false,
  storyCheckedTrash: false,
  storyFoundKnife: false,
  talkedToRune: false,
  talkedToBartender: false,
  talkedToDoorman: false,
  checkedUpstairs: false,
  calledPoliceAfterHelp: false,
  alibiScore: 0,
  askedPoliceWhoWasThere: false,
  askedPoliceMurderWeapon: false,
  askedPoliceSubstances: false,
  storyEnding: /** @type {'good' | 'bad' | null} */ (null),
};

/**
 * @typedef {typeof storyInitialState} StoryState
 */

/**
 * @typedef {Omit<import('./engine.js').VisualNovelEngine, 'initialState' | 'state' | 'setState' | 'resetState'> & {
 *   initialState: StoryState,
 *   state: StoryState,
 *   setState: (updates?: Partial<StoryState>) => StoryState,
 *   resetState: () => StoryState,
 * }} StoryEngine
 */

/**
 * @typedef {(game: StoryEngine, details: import('./engine.js').EngineActionDetails) => (string | void | null)} StoryAction
 * @typedef {(game: StoryEngine, context: import('./engine.js').EngineConditionContext) => boolean} StoryCondition
 */

// A condition is used by HTML attributes like `data-visible-if`.
// Return `true` when an element should be visible, and `false` when it should be hidden.
/** @type {Record<string, StoryCondition>} */
const storyConditions = {
  /**
   * @param {StoryEngine} game
   * @returns {boolean}
   */
  hasCheckedHandprint(game) {
    return game.state.storyCheckedHandprint === true;
  },

  /**
   * @param {StoryEngine} game
   * @returns {boolean}
   */
  hasCheckedTrash(game) {
    return game.state.storyCheckedTrash === true;
  },

  /**
   * @param {StoryEngine} game
   * @returns {boolean}
   */
  hasFoundKnife(game) {
    return game.state.storyFoundKnife === true;
  },
};

// `storyActions` is where you add custom JavaScript for your story.
// Each action is a named function that HTML can call from `data-run="..."`.
// Actions can read `game.state`, save values with `game.setState(...)`,
// update the dialog, play audio, or return a scene id to move somewhere else.
/** @type {Record<string, StoryAction>} */
const storyActions = {
  /**
   * @param {StoryEngine} game
   * @returns {string}
   */
  restartStory(game) {
    game.stopAllAudio();
    game.resetState();
    return 'toilet-scene';
  },

  /**
   * @param {StoryEngine} game
   * @returns {void}
   */
  encourageCaroline(game) {
    game.setState({
      statTrust: game.state.statTrust + 1,
    });
  },

  /**
   * @param {StoryEngine} game
   * @returns {string}
   */
  callPoliceImmediately(game) {
    game.setState({
      calledPoliceAfterHelp: false,
      alibiScore: game.state.alibiScore - 1,
    });
    return 'call-the-police-scene';
  },

  /**
   * @param {StoryEngine} game
   * @returns {string}
   */
  callPoliceAfterHelping(game) {
    game.setState({
      calledPoliceAfterHelp: true,
    });
    return 'call-the-police-scene';
  },

  /**
   * @param {StoryEngine} game
   * @returns {void}
   */
  resolvePoliceOpening(game) {
    if (game.state.calledPoliceAfterHelp) {
      game.setDialog(
        'Michael',
        'Du prøvede at hjælpe hende først. Desværre var der ikke noget du kunne gøre, og hun døde ved 06:23, er det korrekt forstået?',
        '#2c7be5',
      );
      return;
    }

    game.setDialog(
      'Michael',
      'Du ringede med det samme til politiet. Efter at have tjekket hele hendes krop, har vi fundet nogle interessante ting. Fortæl mig lige, kan du huske om du og Sofie havde et skænderi eller at I sloges om noget?',
      '#2c7be5',
    );
  },

  /**
   * @param {StoryEngine} game
   * @returns {void}
   */
  markTalkedToRune(game) {
    if (game.state.talkedToRune) {
      return;
    }

    game.setState({
      talkedToRune: true,
    });
  },

  /**
   * @param {StoryEngine} game
   * @returns {void}
   */
  markTalkedToBartender(game) {
    if (game.state.talkedToBartender) {
      return;
    }

    game.setState({
      talkedToBartender: true,
    });
  },

  /**
   * @param {StoryEngine} game
   * @returns {void}
   */
  markTalkedToDoorman(game) {
    if (game.state.talkedToDoorman) {
      return;
    }

    game.setState({
      talkedToDoorman: true,
    });
  },

  /**
   * @param {StoryEngine} game
   * @returns {string | void}
   */
  inspectVipRoom(game) {
    const canEnter =
      game.state.talkedToRune &&
      game.state.talkedToBartender &&
      game.state.talkedToDoorman;

    if (!canEnter) {
      game.setDialog(
        'Caroline',
        'Jeg tror ikke jeg er klar til at kigge der endnu.',
        '#79b8f9',
      );
      return;
    }

    return 'VIP-room-scene';
  },

  /**
   * @param {StoryEngine} game
   * @returns {void}
   */
  markCheckedUpstairs(game) {
    if (game.state.checkedUpstairs) {
      return;
    }

    game.setState({
      checkedUpstairs: true,
    });
  },

  /**
   * @param {StoryEngine} game
   * @returns {string}
   */
  askPoliceWhoWasThere(game) {
    if (!game.state.askedPoliceWhoWasThere) {
      game.setState({
        askedPoliceWhoWasThere: true,
        alibiScore: game.state.alibiScore + (game.state.talkedToRune ? 1 : -1),
      });
    }

    return game.state.talkedToRune
      ? 'police-rune-scene'
      : 'police-scene';
  },

  /**
   * @param {StoryEngine} game
   * @returns {string}
   */
  askPoliceMurderWeapon(game) {
    if (!game.state.askedPoliceMurderWeapon) {
      let alibiDelta = -1;

      if (game.state.itemHasKnife) {
        alibiDelta = 0;
      }

      game.setState({
        askedPoliceMurderWeapon: true,
        alibiScore: game.state.alibiScore + alibiDelta,
      });
    }

    if (game.state.itemHasKnife) {
      return 'police-took-knife-scene';
    }

    return 'police-default-scene';
  },

  /**
   * @param {StoryEngine} game
   * @returns {string}
   */
  askPoliceSubstances(game) {
    if (!game.state.askedPoliceSubstances) {
      game.setState({
        askedPoliceSubstances: true,
        alibiScore: game.state.alibiScore + (game.state.checkedUpstairs ? 1 : -1),
      });
    }

    return game.state.checkedUpstairs
      ? 'police-branch-1-3-upstairs-scene'
      : 'police-branch-1-3-default-scene';
  },

  /**
   * @param {StoryEngine} game
   * @returns {string}
   */
  resolvePoliceEnding(game) {
    const hasFullCase =
      game.state.talkedToRune &&
      game.state.checkedUpstairs &&
      game.state.itemHasKnife;

    game.stopAllAudio();

    if (hasFullCase) {
      return 'ending-police-good';
    }

    return game.state.alibiScore <= 0
      ? 'police-ending-1-scene'
      : 'police-ending-2-scene';
  },

  /**
   * @param {StoryEngine} game
   * @param {import('./engine.js').EngineActionDetails} details
   * @returns {void}
   */
  goToSceneAfterHandprint(game, details) {
    if (game.state.storyCheckedHandprint === true) {
      const targetScene = details.button?.dataset.targetScene;

      if (targetScene) {
        game.goTo(targetScene);
      }

      return;
    }

    game.setDialog(
      'Caroline',
      'Vi skal først finde noget',
      '#79b8f9',
    );
  },

  /**
   * @param {StoryEngine} game
   * @returns {void}
   */
  inspectHandprint(game) {
    if (game.state.storyCheckedHandprint) {
      game.setDialog(
        '',
        'Du har allerede undersøgt håndaftrykket.',
        '#bdf9ac',
      );
      return;
    }

    game.setState({
      storyCheckedHandprint: true,
      alibiScore: game.state.alibiScore + 1,
    });

    game.setDialog(
      'Caroline',
      'Der er et håndaftryk i blod. Det er næsten helt utydeligt, men det peger væk fra klubben og over mod baren.',
      '#bdf9ac',
    );
  },

  /**
   * @param {StoryEngine} game
   * @returns {void}
   */
  markCheckedTrash(game) {
    if (game.state.storyCheckedTrash) {
      return;
    }

    game.setState({
      storyCheckedTrash: true,
    });
  },

  /**
   * @param {StoryEngine} game
   * @returns {void}
   */
  takeKnife(game) {
    game.setState({
      storyCheckedTrash: true,
      storyFoundKnife: true,
      itemHasKnife: true,
    });
  },

};

VisualNovelEngine.boot({
  // Change this if you want the story to begin in another scene from index.html.
  startSceneId: 'toilet-scene',
  initialState: storyInitialState,
  conditions: /** @type {Record<string, import('./engine.js').EngineCondition>} */ (
    storyConditions
  ),
  actions: /** @type {Record<string, import('./engine.js').EngineAction>} */ (
    storyActions
  ),
});
