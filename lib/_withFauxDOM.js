var React = require('react')
var window = require('window')
var createReactClass = require('create-react-class')
var mapValues = require('./utils/mapValues')

function withFauxDOMFactory (Element) {
  function withFauxDOM (WrappedComponent) {
    var WithFauxDOM = createReactClass({
      componentWillMount: function () {
        this.connectedFauxDOM = {}
        this.animateFauxDOMUntil = 0
        this.fauxDOMAnimationFrameId = -1
      },
      componentWillUnmount: function () {
        this.stopAnimatingFauxDOM()
      },
      connectFauxDOM: function (node, name, discardNode) {
        if (!this.connectedFauxDOM[name] || discardNode) {
          this.connectedFauxDOM[name] = typeof node !== 'string' ? node : new Element(node)
          setTimeout(this.drawFauxDOM)
        }
        return this.connectedFauxDOM[name]
      },
      drawFauxDOM: function () {
        var virtualDOM = mapValues(this.connectedFauxDOM, function (n) {
          return n.toReact()
        })
        this.setState(virtualDOM)
      },
      animateFauxDOM: function (duration) {
        this.animateFauxDOMUntil = Math.max(Date.now() + duration, this.animateFauxDOMUntil)
        if (this.fauxDOMAnimationFrameId < 0) {
          var animateFn = function () {
            if (Date.now() < this.animateFauxDOMUntil) {
              this.drawFauxDOM()
              this.fauxDOMAnimationFrameId = window.requestAnimationFrame(animateFn)
            } else {
              this.stopAnimatingFauxDOM()
            }
          }.bind(this)
          this.fauxDOMAnimationFrameId = window.requestAnimationFrame(function () {
            animateFn()
          })
        }
      },
      stopAnimatingFauxDOM: function () {
        window.cancelAnimationFrame(this.fauxDOMAnimationFrameId)
        this.fauxDOMAnimationFrameId = -1
        this.animateFauxDOMUntil = 0
      },
      isAnimatingFauxDOM: function () {
        return this.fauxDOMAnimationFrameId !== -1
      },
      render: function () {
        var props = Object.assign({}, this.props, this.state, {
          connectFauxDOM: this.connectFauxDOM,
          drawFauxDOM: this.drawFauxDOM,
          animateFauxDOM: this.animateFauxDOM,
          stopAnimatingFauxDOM: this.stopAnimatingFauxDOM,
          isAnimatingFauxDOM: this.isAnimatingFauxDOM
        })
        return React.createElement(WrappedComponent, props)
      }
    })
    WithFauxDOM.displayName = 'WithFauxDOM(' + getDisplayName(WrappedComponent) + ')'
    return WithFauxDOM
  }

  return withFauxDOM
}

function getDisplayName (WrappedComponent) {
  return WrappedComponent.displayName || WrappedComponent.name || 'Component'
}

module.exports = withFauxDOMFactory
