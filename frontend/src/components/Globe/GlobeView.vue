<template>
  <div ref="globeEl" class="globe-container"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import Globe from 'globe.gl'
import { dummyTrips, convertTripsToArcs, processDestinationsFromTrips } from '@/data/dummyTrips.js'

const globeEl = ref(null)
let myGlobe = null
const OPACITY = 0.3
let activePinTooltip = null
let activeTripPreview = null
let hoveredTripId = null

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

onMounted(() => {
  initializeGlobe()
  window.addEventListener('resize', handleResize)
  document.addEventListener('click', handleDocumentClick)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  document.removeEventListener('click', handleDocumentClick)
  if (myGlobe) {
    myGlobe = null
  }
})

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
          onclick="window.openTripPreview(${trip.tripId}, this.closest('.pin-tooltip'))"
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
          onmouseover="this.style.color='#6bb3ff'"
          onmouseout="this.style.color='#4a9eff'"
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
  const trip = dummyTrips.find(t => t.id === arc.tripId)
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
  const arcs = convertTripsToArcs(dummyTrips)
  const stackedArcs = groupArcsByRoute(arcs)
  const destinations = processDestinationsFromTrips(dummyTrips)
  
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
      const op = hoveredTripId === null ? OPACITY : 
                 hoveredTripId === d.tripId ? 0.9 : OPACITY / 4
      const startColor = d.userColor.replace('1)', `${op})`)
      const endColor = d.userColor.replace('1)', `${op})`)
      return [startColor, endColor]
    })
    .arcStroke(d => hoveredTripId === d.tripId ? 0.8 : 0.5)
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

function showTooltip(destination, pinElement) {
  if (globeEl.value) {
    globeEl.value.style.pointerEvents = 'none'
  }
  
  const tooltip = document.createElement('div')
  tooltip.className = 'pin-tooltip'
  tooltip.innerHTML = createTooltipContent(destination)
  tooltip.style.position = 'absolute'
  tooltip.style.pointerEvents = 'auto'
  tooltip.style.zIndex = '10000'
  tooltip.style.left = '50%'
  tooltip.style.top = '0'
  tooltip.style.transform = 'translate(-50%, calc(-100% - 10px))'
  
  tooltip.addEventListener('click', (e) => {
    e.stopPropagation()
  })
  
  pinElement.appendChild(tooltip)
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

function showTripPreviewFromTooltip(tripId, tooltipElement) {
  const existingPreview = document.querySelector('.trip-preview-tooltip')
  if (existingPreview) {
    existingPreview.remove()
  }
  
  const trip = dummyTrips.find(t => t.id === tripId)
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
  
  const tooltipRect = tooltipElement.getBoundingClientRect()
  const centerX = tooltipRect.left + (tooltipRect.width / 2)
  const centerY = tooltipRect.top + (tooltipRect.height / 2)
  
  const position = calculateBestPosition(centerX, centerY, 320, 400, 30)
  
  preview.style.left = `${position.left}px`
  preview.style.top = `${position.top}px`
  preview.style.transform = position.transform
  
  const button = preview.querySelector('button')
  if (button) {
    button.onclick = () => {
      console.log(`Navigate to trip ${tripId}`)
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
    button.onclick = () => {
      console.log(`Navigate to trip ${arc.tripId}`)
    }
  }
  
  document.body.appendChild(preview)
  
  const position = calculateBestPosition(event.clientX, event.clientY)
  
  preview.style.left = `${position.left}px`
  preview.style.top = `${position.top}px`
  preview.style.transform = position.transform
  
  activeTripPreview = arc
}

function handleArcClick(arc, event) {
  if (activeTripPreview === arc) {
    activeTripPreview = null
    const preview = document.querySelector('.trip-preview-tooltip')
    if (preview) preview.remove()
  } else {
    showTripPreview(arc, event)
  }
}

function handleArcHover(hoverArc) {
  hoveredTripId = hoverArc ? hoverArc.tripId : null
  
  myGlobe.arcColor(myGlobe.arcColor())
  myGlobe.arcStroke(myGlobe.arcStroke())
  
  const destinations = processDestinationsFromTrips(dummyTrips)
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
