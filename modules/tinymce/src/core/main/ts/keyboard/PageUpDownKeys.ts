/**
 * Copyright (c) Tiny Technologies, Inc. All rights reserved.
 * Licensed under the LGPL or a commercial license.
 * For LGPL see License.txt in the project root for license information.
 * For commercial licenses see https://www.tiny.cloud/
 */

import { Cell } from '@ephox/katamari';
import { PlatformDetection } from '@ephox/sand';
import Editor from '../api/Editor';
import { NodeChangeEvent } from '../api/EventTypes';
import { EditorEvent } from '../api/PublicApi';
import VK from '../api/util/VK';
import * as InlineBoundariesNavigation from './InlineBoundariesNavigation';
import * as MatchKeys from './MatchKeys';

const platform = PlatformDetection.detect();

const executeKeyupAction = (editor: Editor, evt: KeyboardEvent) => {
  MatchKeys.execute([
    { keyCode: VK.PAGE_UP, action: MatchKeys.action(InlineBoundariesNavigation.moveToLineEndPoint, editor, false) },
    { keyCode: VK.PAGE_DOWN, action: MatchKeys.action(InlineBoundariesNavigation.moveToLineEndPoint, editor, true) },
    { keyCode: VK.UP, metaKey: platform.os.isOSX(), action: MatchKeys.action(InlineBoundariesNavigation.moveToLineEndPoint, editor, false) },
    { keyCode: VK.DOWN, metaKey: platform.os.isOSX(), action: MatchKeys.action(InlineBoundariesNavigation.moveToLineEndPoint, editor, true) }
  ], evt);
};

const stopImmediatePropagation = (e: EditorEvent<NodeChangeEvent>) => e.stopImmediatePropagation();

const isPageUpDown = (evt: EditorEvent<KeyboardEvent>) =>
  evt.keyCode === VK.PAGE_UP || evt.keyCode === VK.PAGE_DOWN;

const setNodeChangeBlocker = (blocked: Cell<boolean>, editor: Editor, block: boolean) => {
  // Node change event is only blocked while the user is holding down the page up/down key it would have limited effects on other things
  // Prevents a flickering UI while caret move in and out of the inline boundary element
  if (block && !blocked.get()) {
    editor.on('NodeChange', stopImmediatePropagation, true);
  } else if (!block && blocked.get()) {
    editor.off('NodeChange', stopImmediatePropagation);
  }

  blocked.set(block);
};

// Determining the correct placement on key up/down is very complicated and would require handling many edge cases,
// which we don't have the resources to handle currently. As such, we allow the browser to change the selection and then make adjustments later.
const setup = (editor: Editor) => {
  const blocked = Cell(false);

  editor.on('keydown', (evt) => {
    if (isPageUpDown(evt)) {
      setNodeChangeBlocker(blocked, editor, true);
    }
  });

  editor.on('keyup', (evt) => {
    if (evt.isDefaultPrevented() === false) {
      executeKeyupAction(editor, evt);
    }

    if (isPageUpDown(evt) && blocked.get()) {
      setNodeChangeBlocker(blocked, editor, false);
      editor.nodeChanged();
    }
  });
};

export {
  setup
};