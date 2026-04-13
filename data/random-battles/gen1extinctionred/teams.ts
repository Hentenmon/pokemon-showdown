import RandomGen2Teams from '../gen2/teams';
import { Utils } from '../../../lib';

interface HackmonsCupEntry {
	types: string[];
	baseStats: StatsTable;
}

interface Gen1RandomBattleSet {
	role?: string;
	movepool: ID[];
}

interface Gen1RandomBattleSpecies {
	level?: number;
	sets: Gen1RandomBattleSet[];
}

const randomData: { [species: IDEntry]: Gen1RandomBattleSpecies } =
	require('./data.json');

const MEGA_SPECIES = new Set<ID>([
	'venusaurmega',
	'charizardmegax',
	'charizardmegay',
	'blastoisemega',
	'beedrillmega',
	'pidgeotmega',
	'clefablemega',
	'alakazammega',
	'victreebelmega',
	'gengarmega',
	'steelixmega',
	'kangaskhanmega',
	'starmiemega',
	'scizormega',
	'pinsirmega',
	'gyaradosmega',
	'aerodactylmega',
	'dragonitemega',
	'mewtwomegax',
	'mewtwomegay',
]);

const RESTRICTED_SPECIES = new Set<ID>([
	'blissey',
]);

export class RandomGen1Teams extends RandomGen2Teams {

	override randomData = randomData;

	// -----------------------
	// Challenge Cup Teams
	// -----------------------
	override randomCCTeam() {
		this.enforceNoDirectCustomBanlistChanges();

		const team = [];
		const randomN = this.randomNPokemon(this.maxTeamSize, this.forceMonotype);

		for (const pokemon of randomN) {
			const species = this.dex.species.get(pokemon);

			let mbstmin = 1600;
			if (MEGA_SPECIES.has(species.id)) {
				mbstmin = 2000;
			} else if (RESTRICTED_SPECIES.has(species.id)) {
				mbstmin = 1900;
			}

			const stats = species.baseStats;

			let mbst =
				(stats.hp * 2 + 30 + 63 + 100) + 10 +
				(stats.atk * 2 + 30 + 63 + 100) + 5 +
				(stats.def * 2 + 30 + 63 + 100) + 5 +
				(stats.spa * 2 + 30 + 63 + 100) + 5 +
				(stats.spd * 2 + 30 + 63 + 100) + 5 +
				(stats.spe * 2 + 30 + 63 + 100) + 5;

			let level;
			if (this.adjustLevel) {
				level = this.adjustLevel;
			} else {
				level = Math.floor(100 * mbstmin / mbst);

				while (level < 100) {
					mbst =
						Math.floor((stats.hp * 2 + 30 + 63 + 100) * level / 100 + 10) +
						Math.floor((stats.atk * 2 + 30 + 63 + 100) * level / 100 + 5) +
						Math.floor((stats.def * 2 + 30 + 63 + 100) * level / 100 + 5) +
						Math.floor((stats.spa * 2 + 30 + 63 + 100) * level / 100 + 5) +
						Math.floor((stats.spd * 2 + 30 + 63 + 100) * level / 100 + 5) +
						Math.floor((stats.spe * 2 + 30 + 63 + 100) * level / 100 + 5);

					if (mbst >= mbstmin) break;
					level++;
				}
			}

			const ivs = {
				hp: 0,
				atk: this.random(16),
				def: this.random(16),
				spa: this.random(16),
				spd: 0,
				spe: this.random(16),
			};

			ivs.hp =
				(ivs.atk % 2) * 16 +
				(ivs.def % 2) * 8 +
				(ivs.spe % 2) * 4 +
				(ivs.spa % 2) * 2;

			ivs.atk *= 2;
			ivs.def *= 2;
			ivs.spa *= 2;
			ivs.spd = ivs.spa;
			ivs.spe *= 2;

			const evs = { hp: 255, atk: 255, def: 255, spa: 255, spd: 255, spe: 255 };

			const pool = [...this.dex.species.getMovePool(species.id)];
			const moves = this.multipleSamplesNoReplace(pool, 4);

			team.push({
				name: species.baseSpecies,
				species: species.name,
				moves,
				gender: false,
				ability: 'No Ability',
				evs,
				ivs,
				item: '',
				level,
				happiness: 0,
				shiny: false,
				nature: 'Serious',
			});
		}

		return team;
	}

	// -----------------------
	// MAIN RANDOM TEAM
	// -----------------------
	override randomTeam() {
		this.enforceNoDirectCustomBanlistChanges();

		const seed = this.prng.getSeed();
		const pokemon: RandomTeamsTypes.RandomSet[] = [];

		const isMonotype = !!this.forceMonotype;
		const typePool = this.dex.types.names();
		const type = this.forceMonotype || this.sample(typePool);

		const rejectedButNotInvalidPool: string[] = [];

		const typeCount: { [k: string]: number } = {};
		const weaknessCount: { [k: string]: number } =
			{ Electric: 0, Psychic: 0, Water: 0, Ice: 0, Ground: 0, Fire: 0, Dark: 0, Fairy: 0 };

		let numMaxLevelPokemon = 0;
		let hasMegaOrRestricted = false;

		const pokemonPool = Object.keys(
			this.getPokemonPool(type, pokemon, isMonotype, Object.keys(randomData))[0]
		);

		while (pokemonPool.length && pokemon.length < this.maxTeamSize) {
			const species = this.dex.species.get(this.sampleNoReplace(pokemonPool));
			if (!species.exists) continue;

			if (species.id === 'ditto' && this.battleHasDitto) continue;

			const limitFactor = Math.round(this.maxTeamSize / 6) || 1;

			const isMega = MEGA_SPECIES.has(species.id);
			const isRestricted = RESTRICTED_SPECIES.has(species.id);

			if ((isMega || isRestricted) && hasMegaOrRestricted) continue;

			let skip = false;

			for (const t of species.types) {
				if (typeCount[t] >= 2 * limitFactor) skip = true;
			}
			if (skip) continue;

			const pokemonWeaknesses: string[] = [];
			for (const w in weaknessCount) {
				if (this.dex.getEffectiveness(w, species) <= 0) continue;
				if (weaknessCount[w] >= 2 * limitFactor) skip = true;
				pokemonWeaknesses.push(w);
			}
			if (skip) continue;

			if (!this.adjustLevel && this.getLevel(species) === 100 &&
				numMaxLevelPokemon >= limitFactor) continue;

			pokemon.push(this.randomSet(species));

			for (const t of species.types) {
				typeCount[t] = (typeCount[t] || 0) + 1;
			}
			for (const w of pokemonWeaknesses) {
				weaknessCount[w]++;
			}

			if (this.getLevel(species) === 100) numMaxLevelPokemon++;

			if (species.id === 'ditto') this.battleHasDitto = true;

			if (isMega || isRestricted) hasMegaOrRestricted = true;
		}

		// Ensure at least one Mega
		if (!pokemon.some(p => MEGA_SPECIES.has(this.dex.species.get(p.species).id))) {
			const megaPool = Object.keys(randomData).filter(s => MEGA_SPECIES.has(s as ID));
			const megaSpecies = this.dex.species.get(this.sample(megaPool));

		// Replace last mon with a Mega
		pokemon[pokemon.length - 1] = this.randomSet(megaSpecies);
		}

		return pokemon;
	}

	// -----------------------
	// SET GENERATION
	// -----------------------
	override randomSet(species: string | Species): RandomTeamsTypes.RandomSet {
		const ruleTable = this.dex.formats.getRuleTable(this.format);

		species = this.dex.species.get(species);
		const data = randomData[species.id];

		const chosenSet = this.sample(data.sets);
		const pool = [...chosenSet.movepool];

		const moves = this.multipleSamplesNoReplace(pool, Math.min(4, pool.length));

		const level = this.getLevel(species);

		const evs = { hp: 255, atk: 255, def: 255, spa: 255, spd: 255, spe: 255 };
		const ivs = { hp: 30, atk: 30, def: 30, spa: 30, spd: 30, spe: 30 };

		const isMega = MEGA_SPECIES.has(species.id);

// Force correct display + no reversion
		const setSpecies = isMega ? species.name : species.baseSpecies;

		return {
			name: species.baseSpecies, // nickname shown
			species: species.name,     // actual form used in battle
			moves: [...moves],
			ability: 'No Ability',
			evs,
			ivs,
			item: '',
			level,
			shiny: false,
			gender: false,
		};
	}
}

export default RandomGen1Teams;