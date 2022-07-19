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

// TODO:
//   - Implement voting.
//   - Handle new incoming fires.
//   - Handle updates to existing fires.
//   - Handle fires aging out (on a timer?).
//   - Implement camera selection for multicamera fires (from list and map).
//   - Implement user preferences.
//   - Implement user region.
//   - Implement search params.
//   - Implement notifications.
//   - Implement camera ID pinning.
//   - Implement adaptive/mobile version.

import React, {useCallback, useEffect, useRef, useState} from 'react'

import Duration from '../modules/Duration.mjs'

import getCameraKey from '../modules/getCameraKey.mjs'
import getEventSource from '../modules/getEventSource.mjs'
import hasCameraKey from '../modules/hasCameraKey.mjs'

import FireList from './FireList.jsx'

const TIMESTAMP_LIMIT = 2 * Duration.HOUR

/**
 * Responsible for querying the detected fire list, monitoring new fire events,
 * and transitioning between lists of new, extant, and old potential fires.
 *
 * @returns {React.Element}
 */
export default function PotentialFireList() {
  // Fires newer than `TIMESTAMP_LIMIT` (or all fires if `includesAllFires` is
  // `true`) displayed to the user for review.
  const [fires, setFires] = useState([])
  const [includesAllFires, setIncludesAllFires] = useState(false)
  const [indexOfOldFires, setIndexOfOldFires] = useState(-1)

  const allFiresRef = useRef([])
  const eventSourceRef = useRef()
  const sseVersionRef = useRef()

  const updateFires = useCallback((shouldIncludeAllFires) => {
    const {current: allFires} = allFiresRef
    const timestampLimit = Math.round((Date.now() - TIMESTAMP_LIMIT) / 1000)
    const index = allFires.findIndex((x) => x.timestamp < timestampLimit)
    const fires =
      shouldIncludeAllFires ? allFires.slice(0) : allFires.slice(0, index)

    setFires(fires)
    setIndexOfOldFires(index)
  }, [])

  const handleToggleAllFires = useCallback(() => {
    const shouldIncludeAllFires = !includesAllFires
    setIncludesAllFires(shouldIncludeAllFires)
    updateFires(shouldIncludeAllFires)
  }, [includesAllFires, updateFires])

  const handlePotentialFire = useCallback((event) => {
    const fire = JSON.parse(event.data)
    const {croppedUrl, version} = fire

    if (!croppedUrl || croppedUrl.startsWith('c:/')) {
      return
    }

    if (sseVersionRef.current == null) {
      sseVersionRef.current = version
    }

    if (version !== sseVersionRef.current) {
      return window.location.reload()
    }

    const {current: allFires} = allFiresRef
    const key = getCameraKey(fire)
    const existingFire = allFires.find((x) => hasCameraKey(x, key))

    if (existingFire != null) {
      if (existingFire.croppedUrl !== croppedUrl) {
        // Fire is already indexed, but its video has been updated.
        existingFire.croppedUrl = croppedUrl
        // TODO: Update video source, reload video.
        console.error('Not implemented: updateFires()')
      }
    } else {
      allFires.unshift(fire)
      allFires.sort((a, b) => b.sortId - a.sortId)
      updateFires(includesAllFires)
    }
  }, [includesAllFires, updateFires])

  useEffect(() => {
    eventSourceRef.current = getEventSource('/fireEvents')

    const {current: eventSource} = eventSourceRef

    function tidy() {
      eventSource.removeEventListener('newPotentialFire', handlePotentialFire)
      eventSource.removeEventListener('closedConnection', tidy)
      eventSource.close() // Does nothing if the connection is already closed.
      eventSourceRef.current = null
    }

    eventSource.addEventListener('newPotentialFire', handlePotentialFire)
    eventSource.addEventListener('closedConnection', tidy)

    return tidy
  }, [handlePotentialFire])

  return <FireList
    fires={fires}
    indexOfOldFires={includesAllFires ? indexOfOldFires : -1}
    nOldFires={indexOfOldFires > -1 ? allFiresRef.current.length - indexOfOldFires : 0}
    onToggleAllFires={handleToggleAllFires}/>
}
