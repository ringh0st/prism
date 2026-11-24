/*
 * Bringing a guest's save into an account at sign-in (owner: her nephew signed in and lost his game; the account's
 * Pals, outfits, Grove and sparks used to replace the phone's). The phone's save is sent once and combined with the
 * account on the server (supabase/guest_save.sql, `combine_guest_save`), which keeps the higher of every count and
 * joins Pals, outfits and decor. When the account already has its own progress, the player chooses first.
 */

const isBuiltIn = (id) => /^w\d+-\d{2}$/.test(id);

/** Does this device hold a game worth keeping (levels played or a Pal found)? */
export const hasGuestSave = (progress) => Object.keys(progress.levels).length > 0 || Object.keys(progress.pal.owned).length > 0;

/** What the server combines with the account (`p_save` of combine_guest_save). */
export function saveForAccount(progress) {
  return {
    pals: Object.fromEntries(Object.entries(progress.pal.owned).map(([id, owned]) => [id, { stage: owned?.stage ?? 0, growth: owned?.growth ?? 0 }])),
    palId: progress.pal.id,
    accessories: progress.pal.accessories,
    wearing: progress.pal.wearing,
    groveItems: progress.grove.items,
    grovePlaced: progress.grove.placed,
    helpers: progress.helpers,
    sparks: progress.sparks,
    presentsOpened: progress.presents.opened,
    luckyPalsClaimed: progress.luckyPals.claimed,
    legendaryMilestones: progress.presents.milestones ?? 0,
    legendaryPalGift: Boolean(progress.presents.palGift),
    giftDays: progress.giftDays,
  };
}

/** A short picture of a game for the choice: levels solved, stars, Pals and sparks. */
export function saveSummary(levels, palsOwned, sparks) {
  const solved = Object.entries(levels).filter(([id, entry]) => isBuiltIn(id) && entry.stars > 0);
  return { levels: solved.length, stars: solved.reduce((sum, [, entry]) => sum + entry.stars, 0), pals: Object.keys(palsOwned ?? {}).length, sparks: sparks ?? 0 };
}

/** Does the account already have a game of its own (so the player should choose)? */
export const accountHasGame = (summary) => summary.levels > 0 || summary.pals > 0;
