import RandomGen2Teams from '../gen2/teams';

interface Gen1RandomBattleSet {
	role?: string;
	movepool: ID[];
}

interface Gen1RandomBattleSpecies {
	level: number; // now REQUIRED since you control it
	sets: Gen1RandomBattleSet[];
}

const randomData: { [species: ID]: Gen1RandomBattleSpecies } =
	require('./data.json');

export class RandomGen1BabyTeams extends RandomGen2Teams {

	override randomData = randomData;

	// -----------------------
	// MAIN RANDOM TEAM
	// -----------------------
	override randomTeam() {
		this.enforceNoDirectCustomBanlistChanges();

		const pokemon: RandomTeamsTypes.RandomSet[] = [];

		const isMonotype = !!this.forceMonotype;
		const typePool = this.dex.types.names();
		const type = this.forceMonotype || this.sample(typePool);

		const typeCount: { [k: string]: number } = {};
		const weaknessCount: { [k: string]: number } =
			{ Electric: 0, Psychic: 0, Water: 0, Ice: 0, Ground: 0, Fire: 0, Dark: 0, Fairy: 0 };

		const pokemonPool = Object.keys(
			this.getPokemonPool(type, pokemon, isMonotype, Object.keys(randomData))[0]
		);

		while (pokemonPool.length && pokemon.length < this.maxTeamSize) {
			const species = this.dex.species.get(this.sampleNoReplace(pokemonPool));
			if (!species.exists) continue;

			if (species.id === 'ditto' && this.battleHasDitto) continue;

			const limitFactor = Math.round(this.maxTeamSize / 6) || 1;

			let skip = false;

			// Type balance
			for (const t of species.types) {
				if (typeCount[t] >= 2 * limitFactor) skip = true;
			}
			if (skip) continue;

			// Weakness balance
			const pokemonWeaknesses: string[] = [];
			for (const w in weaknessCount) {
				if (this.dex.getEffectiveness(w, species) <= 0) continue;
				if (weaknessCount[w] >= 2 * limitFactor) skip = true;
				pokemonWeaknesses.push(w);
			}
			if (skip) continue;

			pokemon.push(this.randomSet(species));

			for (const t of species.types) {
				typeCount[t] = (typeCount[t] || 0) + 1;
			}
			for (const w of pokemonWeaknesses) {
				weaknessCount[w]++;
			}

			if (species.id === 'ditto') this.battleHasDitto = true;
		}

		return pokemon;
	}

	// -----------------------
	// SET GENERATION
	// -----------------------
	override randomSet(species: string | Species): RandomTeamsTypes.RandomSet {
		species = this.dex.species.get(species);
		const data = randomData[species.id];

		const chosenSet = this.sample(data.sets);
		const pool = [...chosenSet.movepool];

		const moves = this.multipleSamplesNoReplace(pool, Math.min(4, pool.length));

		const evs = { hp: 255, atk: 255, def: 255, spa: 255, spd: 255, spe: 255 };
		const ivs = { hp: 30, atk: 30, def: 30, spa: 30, spd: 30, spe: 30 };

		return {
			name: species.baseSpecies,
			species: species.name,
			moves: [...moves],
			ability: 'No Ability',
			evs,
			ivs,
			item: '',
			level: data.level, // 🔥 YOU control this now
			shiny: false,
			gender: false,
		};
	}
}

export default RandomGen1BabyTeams;