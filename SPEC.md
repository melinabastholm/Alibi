# **SPEC: Level 4 Visual Novel Engine (HTML/CSS/JS)**

## **1. Formål**

Engine’en skal understøtte Level 4-projektet, hvor studerende udvikler et Visual Novel-spil med fokus på:

* valg og konsekvens
* simpel game state (flags/variabler)
* narrativ struktur og flow
* iteration og test

Den skal være:

* simpel at forstå
* nem at ændre i HTML, CSS og JavaScript
* tæt koblet til det, de lærer på 1. semester

---

## **2. Overordnede krav (fra temaet)**

Engine’en skal gøre det muligt at:

* vise dialog og scener
* præsentere valg (A/B eller flere)
* gemme spillerens valg (game state)
* ændre spillets forløb baseret på tidligere valg
* understøtte mindst 2 forskellige slutninger

Spillet skal opleves som:

* en sammenhængende historie
* med mærkbare konsekvenser
* og tydelig progression

---

## **3. Kernefunktionalitet**

### **3.1 Scene-system**

Spillet består af scener, der indeholder:

* baggrund (billede)
* karakter(er)
* dialogtekst
* valg (valgfrit)

Scene skal kunne:

* vises én ad gangen
* skifte til næste scene
* skifte baseret på valg

---

### **3.2 Dialog**

* Tekst vises tydeligt i UI
* Kan være:

    * lineær (klik for næste)
    * koblet til valg

Ingen krav om avanceret tekstsystem (fx typewriter-effekt).

---

### **3.3 Valg (Choices)**

* Spilleren kan vælge mellem mindst 2 muligheder
* Hvert valg:

    * fører til en ny scene
    * kan ændre game state

Valg er centralt for:

* progression
* slutning

---

### **3.4 Game State (Flags / variabler)**

Engine’en skal understøtte simple variabler, fx:

* boolean (true/false)
* simple værdier (fx relation = 1)

Game state bruges til:

* at huske tidligere valg
* at styre hvilke scener der vises
* at afgøre slutning

Eksempel:

* hvis `helpedCharacter = true` → slutning A
* ellers → slutning B

---

### **3.5 Forgrening (Branching)**

* Historien skal kunne forgrene sig
* Forgrening sker via:

    * valg
    * betingelser (if/else)

Skal være muligt at:

* lave simple branches
* lave en slutning baseret på tidligere valg

---

### **3.6 Slutninger**

* Minimum 2 slutninger
* Skal afhænge af tidligere valg
* Skal kunne implementeres med simpel logik

---

## **4. Struktur (teknisk)**

Engine’en skal bestå af:

### **HTML**

* Struktur for:

    * dialog
    * valg-knapper
    * scene/container
* Studerende skal kunne:

    * ændre tekst
    * tilføje elementer

---

### **CSS**

* Styling af:

    * UI
    * tekst
    * valg
* Skal være nem at:

    * ændre farver
    * ændre typografi
    * tilpasse layout

---

### **JavaScript**

* Styrer:

    * scene-skift
    * valg
    * game state
* Skal være:

    * læsbart
    * simpelt
    * muligt at ændre uden avanceret JS

---

## **5. Indhold (student use)**

Engine’en skal gøre det muligt for studerende at arbejde med:

* egne grafiske assets (min. 5)
* egne lyde (min. 2)
* dialog og struktur
* game state og valg

---

## **6. Arbejdsproces-understøttelse**

Engine’en skal understøtte den måde, de arbejder på i Level 4:

* iterativ udvikling (ikke alt planlagt fra start)
* løbende test:

    * virker valgene?
    * giver de forventet resultat?
* mulighed for:

    * at ændre struktur hurtigt
    * at teste forskellige løsninger

---

## **7. Begrænsninger (bevidst simple)**

Engine’en skal **ikke**:

* være et fuldt framework
* have avanceret UI-system
* håndtere komplekse datastrukturer
* kræve avanceret JavaScript

Formålet er læring – ikke performance eller skalerbarhed.

---

## **8. Succeskriterier**

Engine’en er succesfuld hvis:

* studerende kan forstå den
* de aktivt ændrer i:

    * HTML
    * CSS
    * JavaScript
* de kan implementere:

    * valg
    * konsekvenser
    * mindst 2 slutninger
* den understøtter deres projekt uden at styre det

---

## **9. Åbne beslutninger (bevidst ikke fastlagt endnu)**

* Hvordan scener defineres (JSON vs JS vs HTML)
* Hvordan game state struktureres
* UI-struktur og layout
* Hvor meget der er “hardcoded” vs data-drevet
* Hvordan lyd integreres
* Hvordan navigation (klik/knap/keyboard) håndteres

---

## **Kort vurdering**

Det her setup rammer meget præcist jeres Level 4:

* det tvinger dem til at bruge JS → men kun dér hvor det giver mening
* det kobler direkte til HTML/CSS kompetencer fra 1. semester
* det gør game state konkret og forståeligt
* det understøtter jeres proces (iteration, test, showcase)

---


# **Visual Novel Engine – Feature Overview**

## **Formål**

Engine’en skal gøre det muligt at udvikle et Visual Novel-spil i HTML, CSS og JavaScript, hvor studerende arbejder direkte i alle tre lag.

Den skal:

* understøtte narrativ struktur med valg og konsekvenser
* gøre game state konkret og anvendelig
* være simpel at forstå og ændre
* samtidig være fleksibel nok til, at studerende kan udvide med egen JavaScript

---

# **1. Scene-system**

## **Definition**

* Hver scene er et `<section>` element
* Kun én scene er aktiv ad gangen

```html
<section class="scene" id="scene1"></section>
```

## **Funktionalitet**

* Engine’en kan:

  * aktivere en scene
  * skjule alle andre scener
* Scene-skift styres via JavaScript

## **Formål**

* Giver klar struktur
* Matcher HTML’s naturlige opbygning
* Let at forstå visuelt

---

# **2. Scene-scoped elementer (uden IDs)**

## **Problem**

Elementer som karakterer kan optræde i flere scener → kan ikke bruge globale `id`

## **Løsning**

Brug **data-attributter som lokale identifiers**

```html
<div class="character" data-char="maya"></div>
```

## **Engine-adfærd**

* Elementer findes via:

```js
currentScene.querySelector('[data-char="maya"]')
```

## **Fordele**

* Ingen konflikter i DOM
* Samme karakter kan eksistere i flere scener
* Mere fleksibelt og skalerbart

---

# **3. Step-system (scene flow)**

## **Grundidé**

En scene indeholder en liste af steps, som engine’en afvikler.

```html
<div class="steps">
  <div data-step="say">...</div>
  <div data-step="show">...</div>
</div>
```

---

## **Afviklingsmodel (vigtig)**

Steps køres:

> **“samtidig i blokke” – indtil et step stopper flowet**

Det betyder:

* Engine kører steps sekventielt
* MEN stopper ved “wait”-typer
* Alle andre steps udføres med det samme

---

## **Flow-eksempel**

```html
<div data-step="say">Hej</div>
<div data-step="show" data-target='[data-char="jonas"]'></div>
<div data-step="wait-click"></div>
```

👉 `say` + `show` sker sammen
👉 så stopper engine ved `wait-click`

---

# **4. Step-typer (baseline)**

## **say**

Viser dialog og sætter aktiv karakter

```html
<div data-step="say" data-character="maya">
  Hej...
</div>
```

---

## **show / hide**

Viser eller skjuler elementer

```html
<div data-step="show" data-target='[data-char="jonas"]'></div>
```

---

## **choice**

Viser valg og stopper flow

```html
<div data-step="choice">
  <button data-next="scene2">Gå videre</button>
</div>
```

---

## **run**

Kalder en JavaScript-funktion

```html
<div data-step="run" data-action="myFunction"></div>
```

---

## **goto**

Skifter scene

```html
<div data-step="goto" data-scene="scene2"></div>
```

---

## **wait-click**

Stopper flow og venter på bruger

```html
<div data-step="wait-click"></div>
```

---

## **wait-ms**

Stopper flow i et antal millisekunder

```html
<div data-step="wait-ms" data-ms="500"></div>
```

---

# **5. Dialog og aktiv karakter**

## **Dialog**

* Vis tekst fra `say` step
* Opdateres i en dialog-container

## **Aktiv karakter**

* Styres via CSS class

```css
.character.active {
  opacity: 1;
}
```

JS:

```js
setActiveCharacter("maya");
```

---

# **6. Game state (global)**

## **Definition**

Et globalt objekt holder spillets data

```js
const game = {
  state: {}
};
```

## **Brug**

* gemme valg
* styre slutninger
* påvirke flow

```js
game.state.helped = true;
```

---

# **7. Action-system (HTML → JS)**

## **Formål**

Tillade HTML at trigge JavaScript uden at indeholde logik

## **HTML**

```html
<button data-run="helpPlayer">Hjælp</button>
```

## **JS**

```js
game.actions = {
  helpPlayer() {
    game.state.helped = true;
  }
};
```

## **Fordele**

* HTML forbliver simpel
* JS ejer logik
* fleksibel udvidelse

---

# **8. Conditions (kun i JS)**

## **Princip**

* Ingen conditions i HTML
* Al logik i JavaScript

## **Eksempel**

```js
game.actions.checkEnding = () => {
  if (game.state.helped) {
    game.goTo("goodEnding");
  } else {
    game.goTo("badEnding");
  }
};
```

---

# **9. Element targeting**

## **Metode**

Steps bruger CSS selectors

```html
data-target='[data-char="jonas"]'
```

## **JS**

```js
currentScene.querySelector(selector)
```

---

# **10. Animation og visuel kontrol**

## **Ansvar**

* CSS styrer animation
* JS tilføjer/fjerner classes

```js
element.classList.add("enter");
```

## **Engine gør ikke**

* ingen timing-logik for animation
* ingen animation-definition

---

# **11. Flow-kontrol**

## **Vigtige principper**

* Steps kører automatisk
* Flow stopper kun ved:

  * `wait-click`
  * `wait-ms`
  * `choice`

---

## **Designvalg (vigtigt)**

👉 Pauser er **eksplicitte steps**, ikke implicit i fx dialog

---

# **12. Fleksibilitet**

Engine’en skal tillade:

* egne JS-funktioner
* direkte DOM manipulation
* egne animationer
* egne systemer ovenpå engine’en

---

# **13. Begrænsninger (bevidste)**

Engine’en:

* håndterer ikke komplekse conditions i HTML
* håndterer ikke avanceret state management
* er ikke et fuldt framework

Formålet er læring, ikke robusthed.

---

# **Samlet vurdering**

Denne engine:

* passer direkte til jeres Level 4 krav om:

  * valg
  * konsekvens
  * game state
  * struktur

* giver:

  * høj transparens
  * lav teknisk barriere
  * mulighed for udvidelse

---

# **Kort opsummering**

Engine’en består af:

* Scene-system (`section`)
* Step-system (flow + pauses)
* Global game state
* Action-system (HTML → JS)
* CSS-baseret visning og animation
