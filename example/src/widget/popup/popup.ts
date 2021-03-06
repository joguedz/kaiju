const styles = require('./popup.styl')
import { h, Component, VNode, Message, NoArgMessage, ConnectParams, RenderParams, Render } from 'kaiju'
import { Observable } from 'kaiju/observable'
import { findParentByAttr } from 'util/dom'


// Popups are rendered in their own top-level container for clean separation of layers.
const popupLayer = document.getElementById('popupLayer')!


interface Props {
  content: VNode[]
  onClose: NoArgMessage
}

export default function(props: Props) {
  return Component<Props, {}>({ name: 'popup', props, initState, connect, render })
}

function initState() {
  return {}
}

/** Used in the popup DOM content. Requests the popup's parent to close it */
export const close = Message('close')
const overlayClick = Message<MouseEvent>('overlayClick')


// Listen for messages inside the popup container, and redispatch at the Popup launcher level.
function connect({ on, props, msg }: ConnectParams<Props, {}>) {

  const requestClose = () => msg.sendToParent(props().onClose())

  on(msg.listenAt(popupLayer), (_, message) => {

    if (message.is(close)) {
      requestClose()
    }
    else if (message.is(overlayClick)) {
      if (!findParentByAttr('data-popup', message.payload.target as Element))
        requestClose()
    }
    else msg.sendToParent(message)
  })

  on(Observable.fromEvent('keydown', window), (_, evt) => {
    if (evt.keyCode === 27) // ESC
      requestClose()
  })

}


function render({ props }: RenderParams<Props, {}>) {
  const { content } = props

  return (
    h('div', {
      content,
      hook: { insert, postpatch, destroy }
    })
  )
}

function insert(vnode: VNode) {
  const popup = vnode.data._popup = popupWithContent(vnode.data.content)
  Render.into(popupLayer, popup)
}

function postpatch(oldVNode: VNode, vnode: VNode) {
  const oldPopup = oldVNode.data._popup
  const newPopup = popupWithContent(vnode.data.content)

  vnode.data._popup = newPopup

  Render.into(oldPopup, newPopup)
}

const emptyVNode = h('div')
function destroy(vnode: VNode) {
  Render.into(vnode.data._popup, emptyVNode)
}

function popupWithContent(content: VNode[]) {
  return (
    h(`div.${styles.overlay}`, {
      key: 'popup-content',
      hook: { insert: Render.isFirst() ? undefined : insertAnimation, remove: removeAnimation },
      events: { click: overlayClick } }, [

        h(`div.${styles.popup}`, {
          attrs: { 'data-popup': true }
        }, content)
    ])
  )
}


const insertAnimation = (vnode: VNode.Assigned) => {
  const popup = vnode.elm.firstChild as HTMLElement
  popup.classList.add(styles.insertAnimation)
}

const removeAnimation = (vnode: VNode.Assigned, cb: Function) => {
  const overlay = vnode.elm
  overlay.classList.add(styles.removeAnimation)
  overlay.addEventListener('animationend', () => {
    cb()
    popupLayer.removeChild(popupLayer.firstChild!)
  })
}
