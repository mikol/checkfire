// -----------------------------------------------------------------------------
// Copyright 2022 Open Climate Tech Contributors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
// -----------------------------------------------------------------------------

import React, {useMemo} from 'react'
import ReactDOM from 'react-dom'

import ButtonGroup from './ButtonGroup.jsx'
import IconButton from './IconButton.jsx'
import ZoomControl from './ZoomControl.jsx'

export default function PreferencesControl(props) {
  const {container, map} = props

  const jsx = useMemo(() => {
    if (map == null) {
      return null
    }

    const openPrefs = (event) => {
      trap(event)
      window.location.replace('/v2/wildfirecheck/preferences')
    }

    const traps = {
      draggable: true,
      onContextMenu: trap,
      onDragStart: trap,
      onDoubleClick: trap,
      onMouseDown: trap,
      onTouchStart: trap
    }

    return 0,
    <div className="c7e-map--control">
      <ButtonGroup className="c7e-map--control--zoom">
        <IconButton icon='c7e-icon--preferences' label="Preferences" title="Preferences" onClick={openPrefs} {...traps}/>
      </ButtonGroup>

      <ZoomControl map={map}/>
    </div>
  }, [map])

  return container != null
    ? ReactDOM.createPortal(jsx, container)
    : jsx
}

// -----------------------------------------------------------------------------

function trap(event) {
  event.preventDefault()
  event.stopPropagation()
}
