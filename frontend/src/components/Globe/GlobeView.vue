<template>
  <div>
    <div class="top-controls">
      <span
        class="top-link"
        :class="{ active: mode === 'discovery' }"
        @click="setMode('discovery')"
        tabindex="0"
        @keydown.enter="setMode('discovery')"
      >
        Discovery
      </span>
      <span class="sep">|</span>
      <span
        class="top-link"
        :class="{ active: mode === 'friends' }"
        @click="setMode('friends')"
        tabindex="0"
        @keydown.enter="setMode('friends')"
      >
        Friends
      </span>
    </div>
    <div ref="globeEl" class="globe-container"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import Globe from 'globe.gl'
import { dummyTrips, convertTripsToArcs, processDestinationsFromTrips } from '@/data/dummyTrips.js'

const globeEl = ref(null)
let myGlobe = null
const OPACITY = 0.3
let activePinTooltip = null
let activeTripPreview = null
let hoveredTripId = null
let trips = ref([]) 
// UI mode: 'discovery' shows all trips, 'friends' shows only friends' trips
const mode = ref('discovery')
const friendUserIds = ref([])

const filteredTrips = computed(() => {
  if (mode.value === 'discovery') return trips.value
  return trips.value.filter(t => friendUserIds.value.includes(t.userId))
})

async function fetchTrips() {
  try {
    const res = await fetch('/api/trips')
    const data = await res.json()
    if (data.ok) {
      trips.value = data.trips
      console.log('Trips cargados:', trips.value)
    }
  } catch (e) {
    console.error('Error en fetchTrips:', e)
  }
}

const markerSvg = `<svg viewBox="-4 0 36 36">
  <path fill="currentColor" d="M14,0 C21.732,0 28,5.641 28,12.6 C28,23.963 14,36 14,36 C14,36 0,24.064 0,12.6 C0,5.641 6.268,0 14,0 Z"></path>
  <circle fill="black" cx="14" cy="14" r="7"></circle>
</svg>`

const handleDocumentClick = (e) => {
  const clickedOnTooltip = e.target.closest('.pin-tooltip')
  const clickedOnPreview = e.target.closest('.trip-preview-tooltip')
  const clickedOnPin = e.target.closest('.htmlElement')
  
  if (!clickedOnTooltip && !clickedOnPreview && !clickedOnPin) {
    if (activePinTooltip) {
      activePinTooltip = null
      const tooltips = document.querySelectorAll('.pin-tooltip')
      tooltips.forEach(t => t.remove())
      if (globeEl.value) {
        globeEl.value.style.pointerEvents = 'auto'
      }
    }
    if (activeTripPreview) {
      activeTripPreview = null
      const previews = document.querySelectorAll('.trip-preview-tooltip')
      previews.forEach(p => p.remove())
      if (globeEl.value) {
        globeEl.value.style.pointerEvents = 'auto'
      }
    }
  }
}

onMounted(async () => {
  await fetchTrips()
  initializeGlobe()
  window.addEventListener('resize', handleResize)
  document.addEventListener('click', handleDocumentClick)
  // rebuild globe when filteredTrips changes (mode switch)
  watch(filteredTrips, () => {
    rebuildGlobeData()
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  document.removeEventListener('click', handleDocumentClick)
  // stop watchers/listeners
  try { watch.clear && watch.clear() } catch(e) {}
  if (myGlobe) {
    myGlobe = null
  }
})

function setMode(newMode) {
  if (newMode === mode.value) return
  mode.value = newMode
  rebuildGlobeData()
}

function calculatePinSize(visitCount) {
  if (visitCount === 1) return 20
  if (visitCount === 2) return 28
  if (visitCount === 3) return 34
  if (visitCount === 4) return 38
  return 40
}

function groupArcsByRoute(arcs) {
  const routeMap = new Map()
  
  arcs.forEach(arc => {
    const routeKey = `${arc.origin.city}-${arc.destination.city}`
    if (!routeMap.has(routeKey)) {
      routeMap.set(routeKey, [])
    }
    routeMap.get(routeKey).push(arc)
  })
  
  const stackedArcs = []
  routeMap.forEach((arcGroup, routeKey) => {
    const maxStacked = Math.min(arcGroup.length, 3)
    arcGroup.forEach((arc, index) => {
      if (index < maxStacked) {
        stackedArcs.push({
          ...arc,
          stackOffset: index - (maxStacked - 1) / 2,
          groupSize: maxStacked,
          routeKey
        })
      }
    })
  })
  
  return stackedArcs
}

function parseRgba(rgbaStr) {
  const m = rgbaStr.match(/rgba?\(([^)]+)\)/)
  if (!m) return null
  const parts = m[1].split(',').map(p => p.trim())
  const r = Number(parts[0]) || 0
  const g = Number(parts[1]) || 0
  const b = Number(parts[2]) || 0
  const a = parts[3] !== undefined ? Number(parts[3]) : 1
  return { r, g, b, a }
}

function resolveColorToRgba(colorStr, alpha = 1) {
  try {
    // If it's already rgba, try to parse
    const p = parseRgba(colorStr)
    if (p) {
      return rgbaToString({ r: p.r, g: p.g, b: p.b, a: alpha })
    }

    const el = document.createElement('div')
    el.style.color = colorStr
    el.style.display = 'none'
    document.body.appendChild(el)
    const cs = getComputedStyle(el).color // like 'rgb(r, g, b)' or 'rgba(...)'
    document.body.removeChild(el)
    const m = cs.match(/rgba?\(([^)]+)\)/)
    if (!m) return colorStr
    const parts = m[1].split(',').map(s => s.trim())
    const r = Number(parts[0]) || 0
    const g = Number(parts[1]) || 0
    const b = Number(parts[2]) || 0
    return rgbaToString({ r, g, b, a: alpha })
  } catch (e) {
    console.warn('resolveColorToRgba failed for', colorStr, e)
    return colorStr
  }
}

function rgbaToString(c) {
  return `rgba(${Math.round(c.r)}, ${Math.round(c.g)}, ${Math.round(c.b)}, ${Number(c.a).toFixed(3)})`
}

function createTooltipContent(destination) {
  const tripsByUser = {}
  destination.trips.forEach(trip => {
    if (!tripsByUser[trip.userId]) {
      tripsByUser[trip.userId] = {
        userName: trip.userName,
        userColor: trip.userColor,
        userAvatar: `https://i.pravatar.cc/150?u=${trip.userName}`,
        trips: []
      }
    }
    tripsByUser[trip.userId].trips.push({
      tripId: trip.tripId,
      tripName: trip.tripName
    })
  })
  
  const users = Object.values(tripsByUser)
  const maxVisibleUsers = 3
  const visibleUsers = users.slice(0, maxVisibleUsers)
  const remainingCount = users.length - maxVisibleUsers
  
  let usersHtml = visibleUsers.map(user => `
    <div style="margin: 8px 0;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <img src="${user.userAvatar}" 
             style="width: 30px; height: 30px; border-radius: 50%; border: 2px solid ${user.userColor};" 
             alt="${user.userName}">
        <span style="font-size: 13px; color: white; font-weight: 500;">${user.userName}</span>
      </div>
      ${user.trips.map(trip => `
        <button 
          class="trip-link" 
          data-trip-id="${trip.tripId}"
          style="
            display: block;
            width: 100%;
            text-align: left;
            font-size: 11px; 
            color: #4a9eff; 
            margin-left: 38px; 
            margin-top: 4px;
            cursor: pointer;
            text-decoration: underline;
            background: none;
            border: none;
            padding: 2px 0;
            font-family: inherit;
          "
        >
          ${trip.tripName}
        </button>
      `).join('')}
    </div>
  `).join('')
  
  if (remainingCount > 0) {
    usersHtml += `
      <div style="text-align: center; margin-top: 8px; color: #aaa; font-size: 12px;">
        +${remainingCount} más
      </div>
    `
  }
  
  return `
    <div class="pin-tooltip-content" style="
      background: rgba(0, 0, 0, 0.9);
      border-radius: 8px;
      padding: 12px 16px;
      min-width: 200px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.5);
      border: 1px solid rgba(255,255,255,0.2);
      position: relative;
    ">
      <div style="
        font-weight: bold; 
        font-size: 15px; 
        text-align: center; 
        margin-bottom: 8px;
        color: white;
      ">
        ${destination.name}
      </div>
      <div style="
        height: 1px; 
        background: rgba(255,255,255,0.2); 
        margin-bottom: 8px;
      "></div>
      ${usersHtml}
      <div style="
        position: absolute;
        bottom: -8px;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 8px solid transparent;
        border-right: 8px solid transparent;
        border-top: 8px solid rgba(0, 0, 0, 0.9);
      "></div>
    </div>
  `
}

function createTripPreviewTooltip(arc) {
  const trip = trips.value.find(t => t.id === arc.tripId)
  if (!trip) return ''
  
  return `
    <div style="
      background: rgba(0, 0, 0, 0.95);
      border-radius: 12px;
      padding: 0;
      width: 320px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.6);
      border: 1px solid rgba(255,255,255,0.2);
      overflow: hidden;
      position: relative;
    ">
      <div style="
        width: 100%;
        height: 160px;
        background: url('${trip.coverImage}') center/cover;
        position: relative;
      ">
        <div style="
          position: absolute;
          top: 8px;
          right: 8px;
          background: ${trip.userColor};
          color: white;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
        ">
          ${trip.userName}
        </div>
      </div>
      
      <div style="padding: 16px;">
        <div style="
          font-weight: bold; 
          font-size: 18px; 
          color: white;
          margin-bottom: 8px;
        ">
          ${trip.tripName}
        </div>
        
        <div style="
          color: #aaa;
          font-size: 12px;
          margin-bottom: 12px;
        ">
          ${trip.startDate} - ${trip.endDate}
        </div>
        
        <div style="
          color: #ccc;
          font-size: 13px;
          line-height: 1.5;
          margin-bottom: 16px;
          max-height: 60px;
          overflow: hidden;
        ">
          ${trip.description}
        </div>
        
        <button style="
          width: 100%;
          background: ${trip.userColor};
          color: white;
          border: none;
          padding: 10px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s;
        " onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">
          Ver Viaje Completo
        </button>
      </div>
      
      <div style="
        position: absolute;
        bottom: -8px;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 8px solid transparent;
        border-right: 8px solid transparent;
        border-top: 8px solid rgba(0, 0, 0, 0.95);
      "></div>
    </div>
  `
}

function initializeGlobe() {
  const arcs = convertTripsToArcs(filteredTrips.value)
  const stackedArcs = groupArcsByRoute(arcs)
  const destinations = processDestinationsFromTrips(filteredTrips.value)
  
  myGlobe = Globe()(globeEl.value)
    .globeImageUrl('//unpkg.com/three-globe/example/img/earth-night.jpg')
    .backgroundColor('rgba(0, 0, 0, 1)')
    .width(window.innerWidth)
    .height(window.innerHeight)
    
    .arcsData(stackedArcs)
    .arcLabel(d => `${d.userName}: ${d.tripName}`)
    .arcStartLat(d => d.origin.lat + (d.stackOffset * 0.5))
    .arcStartLng(d => d.origin.lng + (d.stackOffset * 0.5))
    .arcEndLat(d => d.destination.lat + (d.stackOffset * 0.5))
    .arcEndLng(d => d.destination.lng + (d.stackOffset * 0.5))
    .arcColor(d => {
      // Use the color provided by the data as the base.
      // When nothing is hovered, show the base color. When one arc is hovered,
      // brighten the hovered arc and fade (darken/transparent) the others.
      if (hoveredTripId === null) {
        const base = resolveColorToRgba(d.userColor, 0.95)
        return [base, base]
      }
      if (hoveredTripId === d.tripId) {
        const bright = resolveColorToRgba(d.userColor, 0.95)
        return [bright, bright]
      }
      // faded other arcs when one is hovered
      const faded = resolveColorToRgba(d.userColor, OPACITY * 0.6)
      return [faded, faded]
    })
    .arcStroke(d => hoveredTripId === d.tripId ? 1.2 : 0.35)
    .arcDashLength(0.4)
    .arcDashGap(0.1)
    .arcDashAnimateTime(2000)
    .onArcHover(handleArcHover)
    .onArcClick(handleArcClick)
    
    .htmlElementsData(destinations)
    .htmlElement(d => {
      const el = document.createElement('div')
      el.innerHTML = markerSvg
      el.style.color = d.pinColor
      el.style.width = `${calculatePinSize(d.visitCount)}px`
      el.style.pointerEvents = 'auto'
      el.style.cursor = 'pointer'
      el.style.position = 'relative'
      el.style.transform = 'translate(-50%, -100%)'
      el.style.opacity = hoveredTripId === null ? '1' : 
        (d.trips.some(t => t.tripId === hoveredTripId) ? '1' : '0.3')
      
      el.onclick = (e) => {
        e.stopPropagation()
        if (activePinTooltip === d) {
          const oldTooltips = document.querySelectorAll('.pin-tooltip')
          oldTooltips.forEach(t => t.remove())
          activePinTooltip = null
          if (globeEl.value) {
            globeEl.value.style.pointerEvents = 'auto'
          }
        } else {
          const oldTooltips = document.querySelectorAll('.pin-tooltip')
          oldTooltips.forEach(t => t.remove())
          // also remove any open trip previews when opening a pin
          const oldPreviews = document.querySelectorAll('.trip-preview-tooltip')
          oldPreviews.forEach(p => p.remove())
          activeTripPreview = null
          activePinTooltip = d
          showTooltip(d, el)
        }
      }
      
      el.onmouseenter = () => {
        el.style.transform = 'translate(-50%, -100%) scale(1.2)'
      }
      
      el.onmouseleave = () => {
        el.style.transform = 'translate(-50%, -100%) scale(1)'
      }
      
      return el
    })
  
  myGlobe.controls().addEventListener('change', () => {
    if (activePinTooltip) {
      activePinTooltip = null
      const tooltips = document.querySelectorAll('.pin-tooltip')
      tooltips.forEach(t => t.remove())
      if (globeEl.value) {
        globeEl.value.style.pointerEvents = 'auto'
      }
    }
    if (activeTripPreview) {
      activeTripPreview = null
      const previews = document.querySelectorAll('.trip-preview-tooltip')
      previews.forEach(p => p.remove())
      if (globeEl.value) {
        globeEl.value.style.pointerEvents = 'auto'
      }
    }
  })
  
  myGlobe.pointOfView({ lat: 20, lng: 0, altitude: 2.5 }, 4000)
}

function rebuildGlobeData() {
  if (!myGlobe) return
  // close overlays when switching mode
  try {
    document.querySelectorAll('.pin-tooltip').forEach(n => n.remove())
    document.querySelectorAll('.trip-preview-tooltip').forEach(n => n.remove())
    document.querySelectorAll('.trip-modal-overlay').forEach(n => n.remove())
    activePinTooltip = null
    activeTripPreview = null
  } catch (e) {}

  const arcs = convertTripsToArcs(filteredTrips.value)
  const stackedArcs = groupArcsByRoute(arcs)
  const destinations = processDestinationsFromTrips(filteredTrips.value)

  myGlobe.arcsData(stackedArcs)
  myGlobe.htmlElementsData(destinations)
}

function showTooltip(destination, pinElement) {
  // disable globe pointer while tooltip is open
  if (globeEl.value) {
    globeEl.value.style.pointerEvents = 'none'
  }

  const tooltip = document.createElement('div')
  tooltip.className = 'pin-tooltip'
  tooltip.innerHTML = createTooltipContent(destination)

  // Attach click listeners to the trip links inside the tooltip
  // Using data-trip-id attributes (set in createTooltipContent)
  setTimeout(() => {
    try {
      const tripLinks = tooltip.querySelectorAll('.trip-link')
      tripLinks.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation()
          const rawId = btn.getAttribute('data-trip-id')
          console.log('pin tooltip: trip link clicked, rawId=', rawId)
          const idNum = Number(rawId)

          // try to locate the trip robustly (accept number or string ids)
          const trip = trips.value.find(t => t.id === idNum || String(t.id) === rawId || t.tripId === rawId || String(t.tripId) === rawId)

          if (!trip) {
            console.warn('Could not find trip for id', rawId, 'trips sample:', trips.value.slice(0,3))
            return
          }

          // close tooltip and any previews
          const oldTooltips = document.querySelectorAll('.pin-tooltip')
          oldTooltips.forEach(t => t.remove())
          const oldPreviews = document.querySelectorAll('.trip-preview-tooltip')
          oldPreviews.forEach(p => p.remove())
          activePinTooltip = null
          activeTripPreview = null
          if (globeEl.value) {
            globeEl.value.style.pointerEvents = 'auto'
          }

          console.log('Opening trip preview (same as arc) for id', trip.id)
          // show the small preview tooltip (same UX as clicking the arc)
          try {
            // pass the click event so preview can position at the pointer
            showTripPreviewFromTooltip(trip.id, tooltip, e)
          } catch (err) {
            console.warn('Could not open trip preview from tooltip, falling back to full modal', err)
            openFullTrip(trip.id)
          }
        })
      })
    } catch (err) {
      // defensive: if something goes wrong attaching listeners, log it
      console.error('Error attaching trip link listeners', err)
    }
  }, 0)

  // place tooltip in document.body so it is not a child of the pin element
  tooltip.style.position = 'fixed'
  tooltip.style.pointerEvents = 'auto'
  tooltip.style.zIndex = '10000'

  // compute a sensible position based on the pin's screen rect
  try {
    const rect = pinElement.getBoundingClientRect()
    const centerX = rect.left + (rect.width / 2)
    const centerY = rect.top + (rect.height / 2)
    const position = calculateBestPosition(centerX, centerY, 240, 200, 8)

    tooltip.style.left = `${position.left}px`
    tooltip.style.top = `${position.top}px`
    tooltip.style.transform = position.transform
  } catch (err) {
    // fallback: attach to center-top of pin if anything fails
    tooltip.style.left = '50%'
    tooltip.style.top = '0%'
    tooltip.style.transform = 'translate(-50%, calc(-100% - 10px))'
    console.warn('Could not position pin tooltip precisely', err)
  }

  // stop propagation so clicks inside the tooltip don't reach the pin element
  tooltip.addEventListener('click', (e) => {
    e.stopPropagation()
  })

  document.body.appendChild(tooltip)
}

function calculateBestPosition(x, y, previewWidth = 320, previewHeight = 400, extraSpacing = 0) {
  const margin = 20 + extraSpacing
  const safeMargin = 20
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  
  const spaceTop = y
  const spaceBottom = viewportHeight - y
  const spaceLeft = x
  const spaceRight = viewportWidth - x
  
  let left = x
  let top = y
  let transform = ''
  
  if (spaceTop > previewHeight + margin && spaceTop > spaceBottom) {
    top = y - margin
    transform = 'translate(-50%, -100%)'
    
    if (top - previewHeight < safeMargin) {
      top = safeMargin + previewHeight
    }
  } else if (spaceBottom > previewHeight + margin) {
    top = y + margin
    transform = 'translate(-50%, 0%)'
    
    if (top + previewHeight > viewportHeight - safeMargin) {
      top = viewportHeight - safeMargin - previewHeight
      transform = 'translate(-50%, 0%)'
    }
  } else if (spaceRight > previewWidth / 2 + margin && spaceRight > spaceLeft) {
    left = x + margin
    top = y
    transform = 'translate(0%, -50%)'
    
    if (top - previewHeight / 2 < safeMargin) {
      top = safeMargin + previewHeight / 2
    } else if (top + previewHeight / 2 > viewportHeight - safeMargin) {
      top = viewportHeight - safeMargin - previewHeight / 2
    }
  } else {
    left = x - margin
    top = y
    transform = 'translate(-100%, -50%)'
    
    if (top - previewHeight / 2 < safeMargin) {
      top = safeMargin + previewHeight / 2
    } else if (top + previewHeight / 2 > viewportHeight - safeMargin) {
      top = viewportHeight - safeMargin - previewHeight / 2
    }
  }
  
  if (left - (previewWidth / 2) < safeMargin) {
    left = safeMargin + previewWidth / 2
  } else if (left + (previewWidth / 2) > viewportWidth - safeMargin) {
    left = viewportWidth - safeMargin - previewWidth / 2
  }
  
  return { left, top, transform }
}

function showTripPreviewFromTooltip(tripId, tooltipElement, clickEvent) {
  const existingPreview = document.querySelector('.trip-preview-tooltip')
  if (existingPreview) {
    existingPreview.remove()
  }
  
  const trip = trips.value.find(t => t.id === tripId)
  if (!trip) return
  
  const arc = { tripId: trip.id }
  
  if (globeEl.value) {
    globeEl.value.style.pointerEvents = 'none'
  }
  
  const preview = document.createElement('div')
  preview.className = 'trip-preview-tooltip'
  preview.innerHTML = createTripPreviewTooltip(arc)
  preview.style.position = 'fixed'
  preview.style.zIndex = '10001'
  preview.style.pointerEvents = 'auto'
  
  preview.addEventListener('click', (e) => {
    e.stopPropagation()
  })
  
  document.body.appendChild(preview)
  
  let posX, posY
  if (clickEvent && typeof clickEvent.clientX === 'number' && typeof clickEvent.clientY === 'number') {
    posX = clickEvent.clientX
    posY = clickEvent.clientY
  } else {
    const tooltipRect = tooltipElement.getBoundingClientRect()
    posX = tooltipRect.left + (tooltipRect.width / 2)
    posY = tooltipRect.top + (tooltipRect.height / 2)
  }

  const position = calculateBestPosition(posX, posY, 320, 400, 8)

  preview.style.left = `${position.left}px`
  preview.style.top = `${position.top}px`
  preview.style.transform = position.transform
  
  const button = preview.querySelector('button')
  if (button) {
    // keep the button visually clickable but prevent it from doing anything
    // (stopPropagation + preventDefault) so it has no functionality
    try {
      button.addEventListener('click', (ev) => { ev.stopPropagation(); ev.preventDefault(); })
    } catch (e) {
      // ignore
    }
  }
  
  activeTripPreview = { tripId }
}

window.openTripPreview = function(tripId, tooltipElement) {
  showTripPreviewFromTooltip(tripId, tooltipElement)
}

function showTripPreview(arc, event) {
  const existingPreview = document.querySelector('.trip-preview-tooltip')
  if (existingPreview) {
    existingPreview.remove()
  }
  
  if (globeEl.value) {
    globeEl.value.style.pointerEvents = 'none'
  }
  
  const preview = document.createElement('div')
  preview.className = 'trip-preview-tooltip'
  preview.innerHTML = createTripPreviewTooltip(arc)
  preview.style.position = 'fixed'
  preview.style.zIndex = '10001'
  preview.style.pointerEvents = 'auto'
  
  preview.addEventListener('click', (e) => {
    e.stopPropagation()
  })
  
  const button = preview.querySelector('button')
  if (button) {
    // keep the button visually clickable but prevent it from doing anything
    try {
      button.addEventListener('click', (ev) => { ev.stopPropagation(); ev.preventDefault(); })
    } catch (e) {
      // ignore
    }
  }
  
  document.body.appendChild(preview)
  
  const position = calculateBestPosition(event.clientX, event.clientY)
  
  preview.style.left = `${position.left}px`
  preview.style.top = `${position.top}px`
  preview.style.transform = position.transform
  
  activeTripPreview = { tripId: arc.tripId }
}

function handleArcClick(arc, event) {
  // Normalize comparison by tripId so different object references still match
  const clickedId = arc ? arc.tripId : null
  const activeId = activeTripPreview && activeTripPreview.tripId ? activeTripPreview.tripId : null

  // If a preview exists for the same trip, close it
  if (activeId && clickedId && Number(activeId) === Number(clickedId)) {
    activeTripPreview = null
    const preview = document.querySelector('.trip-preview-tooltip')
    if (preview) preview.remove()
    return
  }

  // otherwise remove any existing preview and show the new one
  const existingPreview = document.querySelector('.trip-preview-tooltip')
  if (existingPreview) existingPreview.remove()
  activeTripPreview = null
  showTripPreview(arc, event)
}

// Open the full trip view. Emits a window event so the rest of the app
// can listen and handle navigation or open a dedicated modal.
function openFullTrip(tripId) {
  console.log('openFullTrip called for', tripId)

  // remove tooltips/previews
  try {
    document.querySelectorAll('.pin-tooltip').forEach(n => n.remove())
    document.querySelectorAll('.trip-preview-tooltip').forEach(n => n.remove())
    activePinTooltip = null
    activeTripPreview = null
  } catch (e) {
    // ignore
  }

  const trip = trips.value.find(t => t.id === tripId)
  if (!trip) {
    console.warn('Trip not found for openFullTrip:', tripId)
    return
  }

  // disable globe interactions while modal open
  if (globeEl.value) globeEl.value.style.pointerEvents = 'none'

  const overlay = document.createElement('div')
  overlay.className = 'trip-modal-overlay'
  Object.assign(overlay.style, {
    position: 'fixed', left: '0', top: '0', width: '100vw', height: '100vh',
    background: 'rgba(0,0,0,0.6)', zIndex: '40000', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px'
  })

  const modal = document.createElement('div')
  modal.className = 'trip-modal'
  Object.assign(modal.style, {
    maxWidth: '880px', width: '100%', borderRadius: '12px', overflow: 'hidden',
    background: 'linear-gradient(180deg, rgba(10,10,10,1), rgba(18,18,18,1))', boxShadow: '0 20px 60px rgba(0,0,0,0.6)', color: 'white', position: 'relative'
  })

  modal.innerHTML = `
    <div style="display:flex;flex-direction:row;gap:0;">
      <div style="flex:0 0 360px; height:100%;">
        <div style="width:100%; height:100%; background-image: url('${trip.coverImage}'); background-size: cover; background-position:center; min-height:260px"></div>
      </div>
      <div style="flex:1; padding:20px 24px;">
        <div style="display:flex; align-items:center; justify-content:space-between; gap:12px;">
          <div>
            <h2 style="margin:0 0 6px 0; font-size:20px;">${trip.tripName}</h2>
            <div style="color:#bbb; font-size:13px; margin-bottom:8px;">${trip.startDate} - ${trip.endDate}</div>
            <div style="color:#ddd; font-size:14px; line-height:1.5; max-height:220px; overflow:auto;">${trip.description || ''}</div>
          </div>
          <div style="flex-shrink:0;">
            <div style="background:${trip.userColor}; color:white; padding:8px 12px; border-radius:10px; font-weight:600;">${trip.userName}</div>
          </div>
        </div>
        <div style="margin-top:18px; display:flex; gap:12px;">
          <button class="trip-modal-close" style="background:transparent;border:1px solid rgba(255,255,255,0.08);color:#fff;padding:10px 14px;border-radius:8px;cursor:pointer;">Cerrar</button>
        </div>
      </div>
    </div>
  `

  overlay.addEventListener('click', (ev) => {
    if (ev.target === overlay) {
      overlay.remove()
      if (globeEl.value) globeEl.value.style.pointerEvents = 'auto'
      activePinTooltip = null
      activeTripPreview = null
    }
  })

  overlay.appendChild(modal)
  const closeBtn = modal.querySelector('.trip-modal-close')
  if (closeBtn) closeBtn.addEventListener('click', () => { overlay.remove(); if (globeEl.value) globeEl.value.style.pointerEvents = 'auto'; activePinTooltip = null; activeTripPreview = null })

  document.body.appendChild(overlay)

  // still dispatch event for backward compatibility
  try { window.dispatchEvent(new CustomEvent('open-full-trip', { detail: { tripId } })) } catch(e) {}
}

function handleArcHover(hoverArc) {
  hoveredTripId = hoverArc ? hoverArc.tripId : null
  
  myGlobe.arcColor(myGlobe.arcColor())
  myGlobe.arcStroke(myGlobe.arcStroke())
  
  const destinations = processDestinationsFromTrips(trips.value)
  myGlobe.htmlElementsData(destinations)
}

function handleResize() {
  if (myGlobe && globeEl.value) {
    myGlobe
      .width(window.innerWidth)
      .height(window.innerHeight)
  }
}
</script>

<style scoped>
.top-controls {
  position: fixed;
  top: 33px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 60000;
  display: flex;
  align-items: center;
  gap: 8px;
  background: transparent;
}
.top-link {
  background: transparent;
  border: none;
  color: white;
  padding: 0 6px;
  cursor: pointer;
  font-weight: 400;
  font-size: 15px;
  line-height: 1;
  user-select: none;
}
.top-link:hover {
  opacity: 0.9;
}
.top-link.active {
  font-weight: 700; /* negrita cuando está seleccionado */
}
.sep { color: rgba(255,255,255,0.6); margin: 0 6px }
.globe-container {
  width: 100vw;
  height: 100vh;
  position: relative;
  overflow: hidden;
  cursor: grab;
}

.globe-container:active {
  cursor: grabbing;
}
</style>
