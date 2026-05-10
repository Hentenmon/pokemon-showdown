export const Scripts: ModdedBattleScriptsData = {
	inherit: 'gen1',
	gen: 1,

	// ============================
	// TEAM VALIDATION
	// ============================
	onValidateSet(set, format) {
		const species = this.dex.species.get(set.species);
		const errors: string[] = [];

		const isExtRed = format.id === 'gen1extinctionred';

		// ============================
		// SPECIES LEGALITY
		// ============================
		if (!isExtRed) {
			if (species.gen > 1 && !species.isNonstandard) {
				errors.push(`${species.name} is not available in this format.`);
			}
		}

		// ============================
		// MOVE LEGALITY
		// ============================
		const learnset =
			this.dex.species.getLearnsetData(species.id)?.learnset || {};

		for (const moveName of set.moves) {
			const move = this.dex.moves.get(moveName);

			// Direct learnset
			if (learnset[move.id]) continue;

			// Mega fallback to base species learnset
			if (species.baseSpecies) {
				const baseId = this.toID(species.baseSpecies);

				const baseLearnset =
					this.dex.species.getLearnsetData(baseId)?.learnset || {};

				if (baseLearnset[move.id]) continue;
			}

			errors.push(`${species.name} cannot learn ${move.name}.`);
		}

		return errors;
	},

	// ============================
	// TEAM VALIDATION (MEGA CLAUSE)
	// ============================
	onValidateTeam(team, format) {
		const isExtRed = format.id === 'gen1extinctionred';

		let megaCount = 0;

		for (const set of team) {
			const species = this.dex.species.get(set.species);

			const isMega =
				!!species.isMega ||
				species.forme?.includes('Mega') ||
				species.name.includes('Mega');

			if (isMega) megaCount++;

			if (isMega && !isExtRed) {
				return [
					`${species.name} is only allowed in Extinction Red.`,
				];
			}
		}

		if (isExtRed && megaCount > 1) {
			return [
				'You may only use one Mega Pokémon per team in Extinction Red.',
			];
		}
	},

	// ============================
	// SWITCH IN
	// ============================
	onSwitchIn(pokemon) {
		// Reserved for future mechanics
	},

	// ============================
	// INIT PATCHES
	// ============================
	init() {
		// ============================
		// POKÉDEX FIXES
		// ============================
		for (const id in this.data.Pokedex) {
			const species = this.modData('Pokedex', id);

			// Make everything standard
			species.isNonstandard = null;

			// CRITICAL FIX:
			// EVERYTHING belongs to Extinction Red
			species.gen = 1.33;

			// Default tier fallback
			if (!species.tier) species.tier = 'OU';

			// ============================
			// MEGA FIXES
			// ============================
			if (
				species.isMega ||
				species.forme?.includes('Mega') ||
				species.name.includes('Mega')
			) {
				// Keep Mega identity
				species.isMega = true;

				// Prevent transformation behavior
				species.battleOnly = undefined;
				species.requiredMove = undefined;

				// Remove invalid item lock
				if (
					species.requiredItem &&
					!this.data.Items[this.toID(species.requiredItem)]
				) {
					delete species.requiredItem;
				}

				// Copy learnset from base species if needed
				if (species.baseSpecies) {
					const baseId = this.toID(species.baseSpecies);

					const baseLearnset =
						this.data.Learnsets[baseId]?.learnset;

					if (baseLearnset && !this.data.Learnsets[id]) {
						this.modData('Learnsets', id, {
							learnset: {...baseLearnset},
						});
					}
				}
			}
		}

		// ============================
		// MOVE FIXES
		// ============================
		for (const id in this.data.Moves) {
			const move = this.modData('Moves', id);

			move.isNonstandard = null;

			// Make all modern moves legal in ER
			move.gen = 1.33;
		}

		// ============================
		// ITEM FIXES
		// ============================
		for (const id in this.data.Items) {
			const item = this.modData('Items', id);

			item.isNonstandard = null;
			item.gen = 1.33;
		}
	},
};