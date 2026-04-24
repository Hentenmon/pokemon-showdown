import RandomGen2Teams from '../gen2/teams';

function toID(text: any): string {
	return ('' + text).toLowerCase().replace(/[^a-z0-9]+/g, '') as string;
}

const rawRandomData: {[species: string]: any} = require('./data.json');
const rawBabyData: {[species: string]: any} = require('./baby-data.json');

// 🔥 Normalize BOTH datasets ONCE (global, not inside functions)
const randomData: {[id: string]: any} = {};
for (const key in rawRandomData) {
	randomData[toID(key)] = rawRandomData[key];
}

const babyData: {[id: string]: any} = {};
for (const key in rawBabyData) {
	babyData[toID(key)] = rawBabyData[key];
}

const MEGA_SPECIES = new Set([
	'venusaurmega','charizardmegax','charizardmegay','blastoisemega',
	'beedrillmega','pidgeotmega','clefablemega','alakazammega',
	'victreebelmega','gengarmega','steelixmega','kangaskhanmega',
	'starmiemega','scizormega','pinsirmega','gyaradosmega',
	'aerodactylmega','dragonitemega','mewtwomegax','mewtwomegay',
]);

export class RandomGen1ExtinctionRedTeams extends RandomGen2Teams {

	// 🔥 REGULAR RANDOMS
	randomTeam() {
		return this.generateTeam(randomData, true, false);
	}

	// 👶 BABY RANDOMS
	randomBabyTeam() {
		return this.generateTeam(babyData, false, true);
	}

	generateTeam(
		data: {[species: string]: any},
		allowMegas: boolean,
		ignoreWeaknesses: boolean
	) {
		this.enforceNoDirectCustomBanlistChanges();

		const pokemon: RandomTeamsTypes.RandomSet[] = [];

		const isMonotype = !!this.forceMonotype;
		const typePool = this.dex.types.names();
		const type = this.forceMonotype || this.sample(typePool);

		const typeCount: {[k: string]: number} = {};

		let hasMega = false;

		const basePool = Object.keys(
			this.getPokemonPool(type, pokemon, isMonotype, Object.keys(data))[0]
		);

		// Only keep mons that exist in your dataset
		const pokemonPool = basePool.filter(s => data[this.dex.species.get(s).id]);

		while (pokemonPool.length && pokemon.length < this.maxTeamSize) {
			const speciesId = this.sample(pokemonPool);
			const species = this.dex.species.get(speciesId);
			if (!species.exists) {
				pokemonPool.splice(pokemonPool.indexOf(speciesId), 1);
				continue;
			}

			const entry = data[species.id];
			if (!entry || !entry.sets?.length) {
				pokemonPool.splice(pokemonPool.indexOf(speciesId), 1);
				continue;
			}

			const isMega = MEGA_SPECIES.has(species.id);

			// 🚫 Baby = no megas
			if (!allowMegas && isMega) {
				pokemonPool.splice(pokemonPool.indexOf(speciesId), 1);
				continue;
			}

			// 🚫 Only 1 mega in normal
			if (allowMegas && isMega && hasMega) {
				pokemonPool.splice(pokemonPool.indexOf(speciesId), 1);
				continue;
			}

			let skip = false;

			// Type balancing (kept for normal, optional for baby)
			if (!ignoreWeaknesses) {
				for (const t of species.types) {
					if (typeCount[t] >= 2) skip = true;
				}
			}

			if (skip) {
				pokemonPool.splice(pokemonPool.indexOf(speciesId), 1);
				continue;
			}

			// ✅ ACCEPT
			pokemon.push(this.randomSet(species, data));
			pokemonPool.splice(pokemonPool.indexOf(speciesId), 1);

			for (const t of species.types) {
				typeCount[t] = (typeCount[t] || 0) + 1;
			}

			if (isMega) hasMega = true;
		}

		// 🔥 Force 1 mega in normal mode
		if (allowMegas && !pokemon.some(p =>
			MEGA_SPECIES.has(this.dex.species.get(p.species).id)
		)) {
			const megaPool = Object.keys(data).filter(s => MEGA_SPECIES.has(s));
			if (megaPool.length && pokemon.length) {
				const mega = this.dex.species.get(this.sample(megaPool));
				pokemon[pokemon.length - 1] = this.randomSet(mega, data);
			}
		}

		// 🧯 Emergency fallback (prevents empty team crash forever)
		if (!pokemon.length) {
			const fallbackPool = Object.keys(data);
			if (fallbackPool.length) {
				const species = this.dex.species.get(this.sample(fallbackPool));
				pokemon.push(this.randomSet(species, data));
			}
		}

		return pokemon;
	}

	randomSet(
		species: string | Species,
		data: {[species: string]: any}
	): RandomTeamsTypes.RandomSet {
		species = this.dex.species.get(species);
		const entry = data[species.id];

		if (!entry || !entry.sets?.length) {
			throw new Error(`Missing random data for species: ${species.id}`);
		}

		const chosenSet = this.sample(entry.sets);
		const moves = this.multipleSamplesNoReplace(
			[...chosenSet.movepool],
			Math.min(4, chosenSet.movepool.length)
		);

		return {
			name: species.baseSpecies,
			species: species.name,
			moves,
			ability: 'No Ability',
			evs: {hp:255, atk:255, def:255, spa:255, spd:255, spe:255},
			ivs: {hp:30, atk:30, def:30, spa:30, spd:30, spe:30},
			item: '',
			level: entry.level,
			shiny: false,
			gender: false,
		};
	}
}

export default RandomGen1ExtinctionRedTeams;