# AdSense placements – reference

Your ad units are wired in React. Below are **HTML equivalents** if you need them for a static page or another stack.

**Client ID:** `ca-pub-5477601117591913`  
Replace each `YOUR_SLOT_ID_*` with your real ad unit IDs from AdSense (Ads > By ad unit). Use **responsive** display units.

---

## 1. Below page header (all pages)

**Placement:** Directly under the main navigation bar.

```html
<!-- Ad below page header – responsive, with spacing to avoid accidental clicks -->
<div class="ad-wrapper" style="background:#f9fafb; border-bottom:1px solid #f3f4f6; min-height:90px; display:flex; align-items:center; justify-content:center; padding:16px 0; margin:8px 0;">
  <ins class="adsbygoogle"
       style="display:block"
       data-ad-client="ca-pub-5477601117591913"
       data-ad-slot="YOUR_SLOT_ID_BELOW_HEADER"
       data-ad-format="auto"
       data-full-width-responsive="true"></ins>
</div>
<script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
```

---

## 2. Programs page – after first section (form)

**Placement:** After the “Your Current Max Reps” form and Generate button, before the generated program output.

```html
<!-- Ad inside programs content – after first section -->
<div class="ad-wrapper" style="margin:32px 0; display:flex; justify-content:center; padding:16px 0;">
  <ins class="adsbygoogle"
       style="display:block; max-width:970px; width:100%; min-height:90px"
       data-ad-client="ca-pub-5477601117591913"
       data-ad-slot="YOUR_SLOT_ID_PROGRAMS"
       data-ad-format="auto"
       data-full-width-responsive="true"></ins>
</div>
<script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
```

---

## 3. Calorie calculator – above results

**Placement:** Above the results block (summary card / macros), with space from the Calculate button.

```html
<!-- Ad above calorie results -->
<div class="ad-wrapper" style="margin-bottom:32px; display:flex; justify-content:center; padding:16px 0;">
  <ins class="adsbygoogle"
       style="display:block; width:100%; min-height:90px"
       data-ad-client="ca-pub-5477601117591913"
       data-ad-slot="YOUR_SLOT_ID_CALORIE_ABOVE"
       data-ad-format="auto"
       data-full-width-responsive="true"></ins>
</div>
<script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
```

---

## 4. Calorie calculator – below results

**Placement:** Below the results block (after macros and tips), with spacing.

```html
<!-- Ad below calorie results -->
<div class="ad-wrapper" style="margin-top:40px; padding-top:32px; display:flex; justify-content:center; padding:16px 0;">
  <ins class="adsbygoogle"
       style="display:block; width:100%; min-height:90px"
       data-ad-client="ca-pub-5477601117591913"
       data-ad-slot="YOUR_SLOT_ID_CALORIE_BELOW"
       data-ad-format="auto"
       data-full-width-responsive="true"></ins>
</div>
<script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
```

---

## 5. Shop – between product rows

**Placement:** Between product rows (e.g. after every 4 products), full-width row, **not** inside product cards (away from Buy buttons).

```html
<!-- Ad between product rows (full-width row, not near Buy buttons) -->
<div class="ad-wrapper" style="grid-column:1/-1; margin:16px 0; display:flex; justify-content:center; padding:16px 0;">
  <ins class="adsbygoogle"
       style="display:block; max-width:970px; width:100%; min-height:90px"
       data-ad-client="ca-pub-5477601117591913"
       data-ad-slot="YOUR_SLOT_ID_SHOP_BETWEEN"
       data-ad-format="auto"
       data-full-width-responsive="true"></ins>
</div>
<script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
```

---

## Best practices (already applied in React)

- **Responsive:** All use `data-ad-format="auto"` and `data-full-width-responsive="true"`.
- **Spacing:** Wrappers use padding/margin so ads are not flush with buttons or links (reduces accidental clicks).
- **One push per unit:** Each `<ins>` is followed by a single `(adsbygoogle = window.adsbygoogle || []).push({});` (in React this is done in `useEffect` per component).
- **Slot IDs:** Use one ad unit per placement; replace placeholders in `Frontend/src/config/adsense.js` (React) or in the HTML snippets above.
