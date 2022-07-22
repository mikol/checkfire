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

import React, {useEffect, useRef, useState} from 'react'

import getCameraKey from '../modules/getCameraKey.mjs'
import getEventSource from '../modules/getEventSource.mjs'

export default function OrderOfArrival() {
  const [sortIds, setSortIds] = useState([])
  const [timestamps, setTimestamps] = useState([])

  const {current: seen} = useRef({})

  useEffect(() => {
    return prep(({data}) => {
      const fire = JSON.parse(data)
      const key = getCameraKey(fire)

      if (seen[key] !== true) {
        setSortIds([fire.sortId].concat(sortIds))
        setTimestamps([fire.timestamp].concat(timestamps))
        seen[key] = true
      }
    })
  }, [seen, sortIds, timestamps])

  const longest = sortIds.length > timestamps.length ? sortIds : timestamps
  const minSortId = sortIds.reduce((a, x) => Math.min(a, x), Infinity)
  const maxSortId = sortIds.reduce((a, x) => Math.max(a, x), -Infinity)
  const minTimestamp = timestamps.reduce((a, x) => Math.min(a, x), Infinity)
  const maxTimestamp = timestamps.reduce((a, x) => Math.max(a, x), -Infinity)

  return 0,
  <div style={{margin: '24px', textAlign: 'left'}}>
    <pre>  <strong>Sort ID:</strong> {minSortId} min, {maxSortId} max</pre>
    <pre><strong>Timestamp:</strong> {minTimestamp} min, {maxTimestamp} max</pre>
    <table>
      <tbody>
        <tr>
          <th style={{padding: '0 12px', textAlign: 'right'}}>
            <pre style={{margin: 0}}>#</pre>
          </th>
          <th style={{padding: '0 12px', textAlign: 'left'}}>
            <pre style={{margin: 0}}>Sort IDs</pre>
          </th>
          <th style={{padding: '0 12px', textAlign: 'left'}}>
            <pre style={{margin: 0}}>Timestamps</pre>
          </th>
        </tr>

        { longest.map((_, i) => {
          return 0,
          <tr key={i}>
            <td style={{padding: '0 12px', textAlign: 'left'}}>
              <pre style={{margin: 0}}>
                {`${i + 1}`.padStart(3)}
              </pre>
            </td>
            <td style={{padding: '0 12px', textAlign: 'left'}}>
              <pre style={{margin: 0}}>
                {sortIds[i]} {sortIds[i] >= sortIds[i + 1] ? '>=' : '< '}{' '}
                <span style={{opacity: '0.5'}}>{sortIds[i + 1] != null ? sortIds[i + 1] : 'N/A'}</span>
               </pre>
            </td>
            <td style={{padding: '0 12px', textAlign: 'left'}}>
              <pre style={{margin: 0}}>
                {timestamps[i]} {timestamps[i] >= timestamps[i + 1] ? '>=' : '< '}{' '}
                <span style={{opacity: '0.5'}}>{timestamps[i + 1] != null ? timestamps[i + 1] : 'N/A'}</span>
              </pre>
            </td>
          </tr>
        }) }
      </tbody>
    </table>
  </div>
}

// -----------------------------------------------------------------------------

function prep(handlePotentialFire) {
  const eventSource = getEventSource('/fireEvents')
  const handleClosedConnection =
    () => tidy(eventSource, handlePotentialFire, handleClosedConnection)

  eventSource.addEventListener('newPotentialFire', handlePotentialFire)
  eventSource.addEventListener('closedConnection', handleClosedConnection)

  return handleClosedConnection
}

function tidy(eventSource, handlePotentialFire, handleClosedConnection) {
  eventSource.removeEventListener('newPotentialFire', handlePotentialFire)
  eventSource.removeEventListener('closedConnection', handleClosedConnection)
  eventSource.close() // Does nothing if the connection is already closed.
}
