const { combineRgb } = require('@companion-module/base')
const constants = require('./constants')

// Map color names to their PNG constants and RGB values
const COLOR_MAP = {
	red: { png: constants.sd_red_key, rgb: [255, 0, 0] },
	blue: { png: constants.sd_blue_key, rgb: [0, 0, 255] },
	green: { png: constants.sd_green_key, rgb: [0, 255, 0] },
	purple: { png: constants.sd_purple_key, rgb: [128, 0, 128] },
	pink: { png: constants.sd_pink_key, rgb: [255, 192, 203] },
	brown: { png: constants.sd_brown_key, rgb: [165, 42, 42] },
}

// Multi-color combo images: [primary, secondary] -> png
const COMBO_MAP = {
	'blue+red': constants.sd_combo_key,
	'green+red': constants.sd_green_combo_key,
}

const COLOR_NAMES = Object.keys(COLOR_MAP)

// Determine the primary color (fill) and optional secondary (border) from active colors.
// Returns { primary, secondary, png64 } or null if no colors are active.
function resolveColorState(buttonObj) {
	const active = COLOR_NAMES.filter((c) => buttonObj[c] === true)

	if (active.length === 0) {
		return null
	}

	if (active.length === 1) {
		const color = active[0]
		return { primary: color, secondary: null, png64: COLOR_MAP[color].png }
	}

	// Multiple colors active — check for known combos first
	for (const [comboKey, png] of Object.entries(COMBO_MAP)) {
		const [a, b] = comboKey.split('+')
		if (active.includes(a) && active.includes(b)) {
			return { primary: a, secondary: b, png64: png }
		}
	}

	// Fallback: use the first active color as primary, second as secondary border
	const primary = active[0]
	const secondary = active[1]
	return { primary, secondary, png64: COLOR_MAP[primary].png }
}

module.exports = {
	initFeedbacks: function () {
		let self = this
		let feedbacks = {}

		const foregroundColor = combineRgb(255, 255, 255) // White
		const backgroundColorRed = combineRgb(255, 0, 0) // Red

		feedbacks.color = {
			type: 'boolean',
			name: 'Button Color State',
			description: 'If the button is set to a specific color, change colors of the bank',
			defaultStyle: {
				color: foregroundColor,
				bgcolor: backgroundColorRed,
			},
			options: [
				{
					type: 'dropdown',
					label: 'Button',
					id: 'button',
					default: '0',
					choices: self.CHOICES_BUTTONS,
				},
				{
					type: 'dropdown',
					label: 'Color',
					id: 'color',
					default: 'red',
					choices: [
						{ id: 'red', label: 'Red' },
						{ id: 'blue', label: 'Blue' },
						{ id: 'green', label: 'Green' },
						{ id: 'purple', label: 'Purple' },
						{ id: 'pink', label: 'Pink' },
						{ id: 'brown', label: 'Brown' },
					],
				},
			],
			callback: async function (feedback) {
				let buttonObj = self.keyStates.find((k) => k.buttonNumber == parseInt(feedback.options.button))
				if (buttonObj) {
					if (buttonObj[feedback.options.color] === true) {
						return true
					}
				}
				return false
			},
		}

		feedbacks.multiColor = {
			type: 'advanced',
			name: 'Button Multi-Color State',
			description:
				'Shows the button color state as a custom image, including multi-color combos (e.g. blue+red border)',
			options: [
				{
					type: 'dropdown',
					label: 'Button',
					id: 'button',
					default: '0',
					choices: self.CHOICES_BUTTONS,
				},
			],
			callback: async function (feedback) {
				let buttonObj = self.keyStates.find((k) => k.buttonNumber == parseInt(feedback.options.button))
				if (!buttonObj) {
					return {}
				}

				const state = resolveColorState(buttonObj)
				if (!state) {
					// No colors active — show default black
					return {
						png64: constants.sd_black_key,
					}
				}

				return {
					png64: state.png64,
				}
			},
		}

		self.setFeedbackDefinitions(feedbacks)
	},
}
