const styles = require('./green.styl')
const listStyles = require('./list.styl')

import { Component, h, Message, ConnectParams, RenderParams, Hook } from 'kaiju'
import { update } from 'space-lift'

import { editIcon } from 'icon'
import popup, * as Popup from 'widget/popup'
import button from 'widget/button'
import fadeScaleAnimation from 'widget/animation/group/fadeScale'
import { RouteDef, Router, Route } from 'route'


export default function route() {
  return RouteDef('green?popup', {
    enter: router => route => green({ router, route }),
    children: {}
  })
}


function green(props: Props) {
  return Component<Props, State>({ name: 'green', props, initState, connect, render })
}


interface Props {
  router: Router
  route: Route
}

interface State {
  form: Obj<string>
  popupOpened: boolean
}


function initState(props: Props) {
  return {
    form: {},
    popupOpened: !!props.route.params.popup
  }
}


const inputChanged = Message<Event>('inputChanged')
const showPopup = Message<MouseEvent>('showPopup')
const hidePopup = Message('hidePopup')

function connect({ on, props }: ConnectParams<Props, State>) {
  const { router } = props()

  on(inputChanged, (state, evt) => {
    const { name, value } = evt.target as HTMLInputElement
    const newForm = update(state.form, { [name]: value })
    return update(state, { form: newForm })
  })

  on(showPopup, state => {
    const params = update(props().route.params, { popup: 'true' })
    router.replaceParams(params)
    return update(state, { popupOpened: true })
  })

  on(hidePopup, state => {
    const params = update(props().route.params, { popup: undefined! })
    router.replaceParams(params)
    return update(state, { popupOpened: false })
  })
}


function render({ props, state }: RenderParams<Props, State>) {
  const { route } = props
  const { form, popupOpened } = state
  const { firstName, lastName } = form

  const popupEl = popupOpened ? helloPopup() : ''

  return [
    `Green (route id = ${route.params.id})`,

    h('form', [
      input('firstName', firstName, true),
      input('lastName', lastName)
    ]),

    button({
      className: styles.popupButton,
      icon: editIcon(),
      label: 'Open popup',
      events: { mousedown: showPopup }
    }),

    popupEl
  ]
}

function input(name: string, value: string, shouldAutoFocus = false) {
  const hook: Hook | undefined = shouldAutoFocus
    ? { insert: node => (node.elm as HTMLInputElement).focus() }
    : undefined

  return (
    h('label', [
      name,
      h(`input.${styles.input}`, {
        props: { name, value },
        hook,
        events: { input: inputChanged }
      }, '')
    ])
  )
}

function helloPopup() {
  const content = [
    h('h2', 'Hello'),
    list({ initialItems: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] }),
    h('button', { events: { click: Popup.close } }, 'Close')
  ]

  return popup({ content, onClose: hidePopup })
}


const list = (() => {

  interface Props {
    initialItems: number[]
  }

  interface State {
    items: number[]
  }

  function initState(props: Props) {
    return { items: props.initialItems }
  }

  const deleteRow = Message<[number, MouseEvent]>('deleteRow')

  function connect({ on }: ConnectParams<Props, State>) {
    on(deleteRow, (state, [row]) => ({ items: state.items.filter(r => r !== row) }))
  }

  function render({ state }: RenderParams<Props, State>) {

    const itemEls = state.items.map(item => (
      h('li', { key: item }, [
        h('span', String(item)),
        h('input', { props: { value: 'bla' } }),
        h('button', { events: { click: deleteRow.with(item) } }, '✕')
      ])
    ))

    return fadeScaleAnimation(itemEls, `ul.${listStyles.list}`)
  }

  return (props: Props) => {
    return Component<Props, State>({ name: 'list', initState, connect, props, render })
  }
})()
