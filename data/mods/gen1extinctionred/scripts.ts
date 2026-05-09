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
		// SPECIES LEGALITY CHECK
		// ============================
		// ONLY enforce gen restriction outside ExtRed
		if (!isExtRed) {
			if (species.gen > 1 && !species.isNonstandard) {
				errors.push(`${species.name} is not available in this format.`);
			}
		}

		// ============================
		// MOVE LEGALITY CHECK
		// ============================
		const learnset = this.dex.getLearnset(species.id);

		for (const moveName of set.moves) {
			const move = this.dex.moves.get(moveName);

			// fallback safety: allow invalid data to fail gracefully
			if (!learnset?.[move.id]) {
				errors.push(`${species.name} cannot learn ${move.name}.`);
			}
		}

		return errors;
	},

	// ============================
	// TEAM VALIDATION (MEGAS)
	// ============================
	onValidateTeam(team, format) {
		const isExtRed = format.id === 'gen1extinctionred';

		let megaCount = 0;

		for (const set of team) {
			const species = this.dex.species.get(set.species);

			const isMega =
				!!species.isMega ||
				species.baseSpecies !== species.name ||
				species.forme?.includes('Mega');

			if (isMega) megaCount++;

			// Only allow Megas in ExtRed
			if (isMega && !isExtRed) {
				return [`${species.name} Megas are only allowed in Extinction Red.`];
			}
		}

		// Mega clause (ExtRed only)
		if (isExtRed && megaCount > 1) {
			return ['You may only use one Mega Pokémon per team in Extinction Red.'];
		}
	},

	// ============================
	// SWITCH-IN HOOK (SAFE)
	// ============================
	onSwitchIn(pokemon) {
		// placeholder for future ExtRed mechanics
	},

	// ============================
	// INIT MOD DATA PATCHING
	// ============================
	init() {
		// ============================
		// POKÉDEX FIXES
		// ============================
		for (const id in this.data.Pokedex) {
			const species = this.modData('Pokedex', id);

			// allow custom format to fully override modern restrictions
			species.isNonstandard = null;

			// enforce your custom gen system safely
			if (!species.gen) species.gen = 1.33;

			// ============================
			// MEGA HANDLING (CRITICAL FIX)
			// ============================
			if (species.isMega || species.forme?.includes('Mega')) {
				// IMPORTANT: do NOT strip identity flags needed for validation
				species.isMega = true;

				// ensure it is treated as standalone species
				species.battleOnly = undefined;

				// DO NOT delete forme or requiredItem blindly anymore
				// they are needed for proper detection pipelines

				// optional cleanup: prevent item lock issues only
				if (
					species.requiredItem &&
					!this.data.Items[this.toID(species.requiredItem)]
				) {
					delete species.requiredItem;
				}
			}
		}

		// ============================
		// MOVE FIXES
		// ============================
		for (const id in this.data.Moves) {
			const move = this.modData('Moves', id);
			move.isNonstandard = null;
		}

		// ============================
		// ITEM FIXES
		// ============================
		for (const id in this.data.Items) {
			const item = this.modData('Items', id);
			item.isNonstandard = null;
			item.gen = 1;
		}
	},
};