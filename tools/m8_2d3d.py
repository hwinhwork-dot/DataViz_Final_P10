"""M8: Compare a flat heatmap and 3D columns using the same observed prices."""
# M8.0 Load the weekly data and the shared visual style.
from pathlib import Path
import sys
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from matplotlib.colors import Normalize

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'notebooks'))
from house_style import *
apply_style()
FIG = ROOT / 'report' / 'figures'
FIG.mkdir(parents=True, exist_ok=True)

# M8.1 Build one transparent source table for both charts.
ITEMS = ['SP01', 'SP02', 'SP05', 'SP09']
weeks = [f'week_{i}' for i in range(1, 9)]
raw = pd.read_csv(ROOT / 'data' / 'clean' / 'weekly_table.csv')
raw = raw.loc[raw['item_code'].isin(ITEMS)].copy()
assert set(raw['item_code']) == set(ITEMS), 'M8 source items are missing'
assert set(raw['channel']) == set(CHANNEL_ORDER), 'Missing channels'
assert len(raw) == 4 * 3 * 2, 'Expected two district rows per food and channel'
long = raw.melt(id_vars=['item_code', 'channel', 'district'], value_vars=weeks,
                var_name='week', value_name='price_vnd')
long['price_vnd'] = pd.to_numeric(long['price_vnd'], errors='coerce')
assert (long['price_vnd'].dropna() >= 0).all(), 'Negative prices in source'
by_week = long.groupby(['item_code', 'channel', 'week'], as_index=False)['price_vnd'].mean()
assert len(by_week) == 4 * 3 * 8, 'Expected exactly 96 food, channel and week cells'
summary = (by_week.groupby(['item_code', 'channel'], as_index=False)['price_vnd']
           .mean().rename(columns={'price_vnd': 'mean_vnd'}))
table = (summary.pivot(index='item_code', columns='channel', values='mean_vnd')
         .reindex(index=ITEMS, columns=CHANNEL_ORDER))
assert table.notna().all().all(), 'A food/channel average is missing'
print('M8 selected item codes:', ITEMS)
print('Observed weekly combinations:', int(by_week['price_vnd'].notna().sum()), '/ 96')
print('Same values behind both charts, VND per standard unit:')
print(table.round(1).to_string())
summary.to_csv(ROOT / 'report' / 'm8_price_index_table.csv', index=False)

values = table.to_numpy(dtype=float) / 1000.0
lowest = np.unravel_index(np.argmin(values), values.shape)
highest = np.unravel_index(np.argmax(values), values.shape)
heading = f"{ITEMS[highest[0]]} on {CHANNEL_EN[CHANNEL_ORDER[highest[1]]].lower()} has the highest of these 12 averages"
subtitle = 'Mean price in thousand VND per standard unit; weeks 1 to 8; both districts'
source = 'Source: P10 collected price sheet, weeks 1 to 8, Quận 3 and Quận 10. Averages may hide weekly swings.'

# M8.2 Flat heatmap: read one number on a common colour scale.
fig, ax = plt.subplots(figsize=(9, 4.9))
norm = Normalize(vmin=0, vmax=float(np.nanmax(values)))
im = ax.imshow(values, cmap=SEQ, norm=norm, aspect='auto')
ax.set_xticks(range(3), [CHANNEL_EN[c] for c in CHANNEL_ORDER]); ax.set_yticks(range(4), ITEMS)
for i in range(4):
    for j in range(3):
        ax.text(j, i, f'{values[i,j]:,.0f}k', ha='center', va='center',
                color='white' if norm(values[i,j]) > .52 else INK, fontsize=10)
ax.tick_params(length=0)
fig.colorbar(im, ax=ax, shrink=.72, label='Thousand VND')
figure_title(fig, heading, subtitle, y=.98)
note(fig, source, y=.005)
fig.subplots_adjust(top=.76, bottom=.16, left=.13, right=.91)
save(fig, FIG / 'm8_2d_prices.png')
plt.close(fig)

# M8.3 Three-dimensional columns: the same 12 prices, all starting at zero.
fig = plt.figure(figsize=(10.5, 6.8))
ax = fig.add_subplot(111, projection='3d')
xs, ys, hs, cs = [], [], [], []
for i in range(4):
    for j in range(3):
        xs.append(i); ys.append(j); hs.append(values[i, j]); cs.append(CHANNEL[CHANNEL_ORDER[j]])
bars3d(ax, xs, ys, hs, cs, base=0)
style3d(ax, elev=19, azim=-55)
ax.set_xticks(range(4), ITEMS)
ax.set_yticks(range(3), [CHANNEL_EN[c] for c in CHANNEL_ORDER])
ax.set_zlim(0, float(np.max(values)) * 1.23)
ax.set_zlabel('Thousand VND')
for x, y, h in zip(xs, ys, hs):
    ax.text(x, y, h + float(np.max(values))*.035, f'{h:,.0f}k', ha='center', fontsize=8)
figure_title(fig, heading, subtitle, y=.97)
note(fig, source, y=.005)
fig.subplots_adjust(top=.88, bottom=.09)
save(fig, FIG / 'm8_3d_prices.png')
plt.close(fig)
print('Saved both figures and their common source table.')
