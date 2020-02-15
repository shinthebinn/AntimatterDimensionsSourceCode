"use strict";

Vue.component("glyph-inventory", {
  data() {
    return {
      inventory: [],
    };
  },
  computed: {
    rowCount: () => player.reality.glyphs.inventorySize / 10,
    colCount: () => 10,
  },
  created() {
    this.on$(GAME_EVENT.GLYPHS_CHANGED, this.glyphsChanged);
    this.glyphsChanged();
  },
  methods: {
    toIndex(row, col) {
      return (row - 1) * this.colCount + (col - 1);
    },
    allowDrag(event) {
      if (event.dataTransfer.types.includes(GLYPH_MIME_TYPE)) event.preventDefault();
    },
    drop(idx, event) {
      const id = parseInt(event.dataTransfer.getData(GLYPH_MIME_TYPE), 10);
      if (isNaN(id)) return;
      const glyph = Glyphs.findById(id);
      if (!glyph) return;
      Glyphs.moveToSlot(glyph, idx);
    },
    deleteGlyph(id, force) {
      deleteGlyph(id, force);
    },
    clickGlyph(col, id) {
      const glyph = Glyphs.findById(id);
      if (!glyph) return;
      if (glyph.symbol === "key266b") {
        new Audio(`audio/note${col}.mp3`).play();
      }
    },
    glyphsChanged() {
      this.inventory = Glyphs.inventory.map(GlyphGenerator.copy);
    },
    sortByPower() {
      Glyphs.sort((a, b) => -a.level * a.strength + b.level * b.strength);
    },
    sortByEffect() {
      // Multiplying by 1e12 per effect guarantees that glyphs with less effects are placed later, and the bitwise
      // inversion is so that the effects with the LOWER id are valued higher in the sorting. This primarily meant
      // for effarig glyph effect sorting, which makes it prioritize timespeed pow highest.
      // eslint-disable-next-line no-bitwise
      Glyphs.sort((a, b) => -(~a.effects * Math.pow(1e12, countEffectsFromBitmask(a.effects))) +
        // eslint-disable-next-line no-bitwise
        (~b.effects * Math.pow(1e10, countEffectsFromBitmask(b.effects))));
    },
    autoClean() {
      Glyphs.autoClean();
    },
    slotClass(index) {
      return index < Glyphs.protectedSlots ? "c-glyph-inventory__protected-slot" : "c-glyph-inventory__slot";
    }
  },
  template: `
  <div class="l-glyph-inventory">
    <div v-for="row in rowCount" class="l-glyph-inventory__row">
      <div v-for="col in colCount"
           class="l-glyph-inventory__slot"
           :class="slotClass(toIndex(row, col))"
           @dragover="allowDrag"
           @drop="drop(toIndex(row, col), $event)">
        <glyph-component v-if="inventory[toIndex(row, col)]"
                         :glyph="inventory[toIndex(row, col)]"
                         :showSacrifice="true"
                         :draggable="true"
                         @shiftClicked="deleteGlyph($event, false)"
                         @ctrlShiftClicked="deleteGlyph($event, true)"
                         @clicked="clickGlyph(col, $event)"/>
      </div>
    </div>
    <div>
      <button class="l-glyph-inventory__sort c-reality-upgrade-btn"
        ach-tooltip="Arranges by decreasing level*rarity"
        @click="sortByPower">
          Sort by power
      </button>
      <button class="l-glyph-inventory__sort c-reality-upgrade-btn"
        ach-tooltip="Group glyphs together based on effects"
        @click="sortByEffect">
          Sort by effects
      </button>
      <button class="l-glyph-inventory__sort c-reality-upgrade-btn"
             ach-tooltip="Sacrifice glyphs that are worse in every way than enough other glyphs"
             @click="autoClean">
       Auto clean
      </button>
    </div>
  </div>
  `,
});
