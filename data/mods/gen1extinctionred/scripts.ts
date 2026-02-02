export const Scripts: ModdedBattleScriptsData = {
	inherit: 'gen1',
	gen: 1,

	onValidateSet(set, format) {
		const species = this.dex.species.get(set.species);
		const errors: string[] = [];

		// Ban non-mod Pokémon
		if (
			species.gen > 1 &&
			!this.dex.mods.gen1extinctionred.Pokedex[species.id]
		) {
			errors.push(`${species.name} is not available in Extinction Red.`);
		}

		// Move legality
		for (const moveName of set.moves) {
			const move = this.dex.moves.get(moveName);
			const learnset = this.dex.getLearnset(species.id);

			if (!learnset || !learnset[move.id]) {
				const baseId = this.toID(species.baseSpecies);
				const baseLearnset = this.dex.getLearnset(baseId);

				if (!baseLearnset || !baseLearnset[move.id]) {
					errors.push(`${species.name} cannot learn ${move.name}.`);
				}
			}
		}

		return errors;
	},

onValidateTeam(team) {
	let megaCount = 0;

	for (const set of team) {
		const species = this.dex.species.get(set.species);

		// Check specifically for "Mega" in the name or the Mega forme property
		const isMega = species.forme === 'Mega' || species.name.includes('-Mega');

		if (isMega) {
			megaCount++;
		}
	}

	if (megaCount > 1) {
		return [
			'You may only use one Mega Pokémon per team in Extinction Red.',
		];
	}
},

	init() {
		/* ============================
		 * POKÉMON FIXES
		 * ============================ */
		for (const id in this.data.Pokedex) {
			const species = this.modData('Pokedex', id);

			species.isNonstandard = null;
			if (!species.tier) species.tier = 'OU';

			// PERMANENT MEGA FIX
			if (species.isMega || species.forme?.includes('Mega')) {
				// Treat Mega as a real species, not a forme
				species.isMega = false;
				species.battleOnly = undefined;
				species.forme = undefined;
				species.formeChange = undefined;

				// Keep baseSpecies ONLY for learnset inheritance
				// (do NOT delete it)
				delete species.requiredItem;
				delete species.requiredMove;

				// Copy base learnset if needed
				const baseId = this.toID(species.baseSpecies);
				if (this.data.Learnsets[baseId]) {
					this.modData('Learnsets', id, {
						learnset: {...this.data.Learnsets[baseId].learnset},
					});
				}
			}
		}

		/* ============================
		 * MOVE FIXES
		 * ============================ */
		for (const id in this.data.Moves) {
			const move = this.modData('Moves', id);
			move.isNonstandard = null;
			delete move.isUniversal;
		}

		/* ============================
		 * ITEM FIXES
		 * ============================ */
		for (const id in this.data.Items) {
			const item = this.modData('Items', id);
			item.isNonstandard = null;
			item.gen = 1;
		}
	},
};
