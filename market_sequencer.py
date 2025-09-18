import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import os
import sys
import json
from datetime import datetime

# ---------------- CONFIG ---------------- #

POSITIVE_THRESHOLDS = [0.0025, 0.003, 0.004, 0.005, 0.006, 0.007, 0.008, 0.009, 0.01]
MAX_DRAWDOWN = -0.02  # 2% max drawdown

INDICATORS_FOR_IDENTITY = [
    'adaptive_EB_sinewave', 'cycle_stage', 'phase_velocity',
    'phase_direction', 'cycle_strength', 'cycle_stability', 'snr'
]

# ---------------- HELPERS ---------------- #

def convert_unix_timestamp(ts):
    """Convert Unix timestamp to human-readable string."""
    try:
        return datetime.fromtimestamp(int(float(ts))).strftime('%Y-%m-%d %H:%M:%S')
    except Exception:
        return str(ts)

def detect_local_minima_maxima(prices, window=5):
    """Find local minima/maxima indices with a simple sliding window."""
    n = len(prices)
    if n < 2*window+1:
        window = max(1, (n-1)//2 - 1)
    mins, maxs = [], []
    for i in range(window, n-window):
        before, after = prices[i-window:i], prices[i+1:i+window+1]
        if np.all(prices[i] <= before) and np.all(prices[i] <= after):
            mins.append(i)
        if np.all(prices[i] >= before) and np.all(prices[i] >= after):
            maxs.append(i)
    return np.array(mins), np.array(maxs)

def detect_segments(close_prices, df_datetime, window_size=5):
    """Generate candidate upward segments based on thresholds."""
    n = len(close_prices)
    local_min_indices, _ = detect_local_minima_maxima(close_prices, window=window_size)
    candidates = []
    for threshold in POSITIVE_THRESHOLDS:
        i = 0
        while i < n-1:
            start_idx, start_price = i, close_prices[i]
            for j in range(i+1, n):
                pct_gain = (close_prices[j]-start_price)/start_price
                if pct_gain >= threshold:
                    candidates.append({
                        'threshold': threshold,
                        'start_index': start_idx,
                        'end_index': j,
                        'start_price': start_price,
                        'end_price': close_prices[j],
                        'pct_change': pct_gain*100,
                        'type': 'positive',
                        'start_time': df_datetime[start_idx],
                        'end_time': df_datetime[j],
                        'is_local_min': start_idx in local_min_indices
                    })
                    break
                if close_prices[j] < start_price:
                    start_idx, start_price = j, close_prices[j]
            i = start_idx+1
    # Deduplicate
    dedup = {}
    for seg in candidates:
        key = (seg['start_index'], seg['end_index'])
        if key not in dedup or seg['pct_change'] > dedup[key]['pct_change']:
            dedup[key] = seg
    return list(dedup.values())

def find_optimal_segments(segments_df, close_prices, max_drawdown=MAX_DRAWDOWN):
    """Dynamic programming optimal positive path finder."""
    if segments_df.empty: return pd.DataFrame()
    segments_df = segments_df.sort_values('start_index').copy()
    # Score: percent change, shorter segments favored, local mins boosted
    segments_df['score'] = segments_df.apply(
        lambda r: r['pct_change']*(1+0.5*(r['pct_change']/(r['end_index']-r['start_index']+1))),
        axis=1
    )
    if 'is_local_min' in segments_df:
        segments_df.loc[segments_df['is_local_min'], 'score'] *= 1.1
    n = len(segments_df)
    dp, prev = [0]*n, [-1]*n
    for i in range(n):
        dp[i] = segments_df.iloc[i]['score']
        for j in range(i):
            if segments_df.iloc[i]['start_index'] > segments_df.iloc[j]['end_index']:
                dd = (segments_df.iloc[i]['start_price']-segments_df.iloc[j]['end_price'])/segments_df.iloc[j]['end_price']*100
                if dd > max_drawdown*100 and dp[j]+segments_df.iloc[i]['score'] > dp[i]:
                    dp[i], prev[i] = dp[j]+segments_df.iloc[i]['score'], j
    if not dp: return pd.DataFrame()
    best_idx = max(range(n), key=lambda k: dp[k])
    path, cur = [], best_idx
    while cur != -1:
        path.append(segments_df.iloc[cur].to_dict())
        cur = prev[cur]
    return pd.DataFrame(path[::-1])

def build_negative_segments(optimal_df, close_prices, df):
    """Build gap segments between optimal positives."""
    negatives, prev_end, prev_price = [], None, None
    for _, seg in optimal_df.iterrows():
        start_idx = int(seg['start_index'])
        if prev_end is not None and prev_end+1 < start_idx:
            neg = make_gap(prev_end, start_idx, prev_price, close_prices, df, len(negatives))
            if neg: negatives.append(neg)
        prev_end, prev_price = int(seg['end_index']), close_prices[int(seg['end_index'])]
    if prev_end is not None and prev_end < len(df)-1:
        neg = make_gap(prev_end, len(df)-1, prev_price, close_prices, df, len(negatives))
        if neg: negatives.append(neg)
    return negatives

def make_gap(start_idx, end_idx, start_price, close_prices, df, seg_id):
    """Helper: create a negative gap segment dict."""
    end_price = close_prices[end_idx]
    pct_change = (end_price-start_price)/start_price*100
    if pct_change > 0: pct_change = -pct_change  # force negative
    return {
        "segment_id": seg_id, "segment_type": "negative",
        "start_index": start_idx+1, "end_index": end_idx,
        "start_time": str(df['datetime'].iloc[start_idx+1]),
        "end_time": str(df['datetime'].iloc[end_idx]),
        "start_price": round(float(start_price),2),
        "end_price": round(float(end_price),2),
        "pct_change": round(float(pct_change),2),
        "segment_length": int(end_idx-start_idx),
        "columns": INDICATORS_FOR_IDENTITY.copy(),
        "data": [[round(float(df.iloc[i][col]),4) if col in df else None
                  for col in INDICATORS_FOR_IDENTITY]
                 for i in range(start_idx+1, end_idx+1)]
    }

def save_json(data, path):
    with open(path,'w') as f: json.dump(data,f,indent=2)
    print(f"[+] Saved {len(data)} segments to {path}")

# ---------------- MAIN ---------------- #

if __name__=="__main__":
    if len(sys.argv)<2: raise RuntimeError("Usage: python script.py file.csv")
    df=pd.read_csv(sys.argv[1])
    if 'time' in df: df['datetime']=df['time'].apply(convert_unix_timestamp)
    close_prices=df['close'].values
    ts=datetime.now().strftime("%Y%m%d_%H%M%S")
    outdir=f"results_{ts}"; os.makedirs(outdir,exist_ok=True)
    jdir=os.path.join(outdir,"json_segments"); os.makedirs(jdir,exist_ok=True)

    # detect candidates + find optimal
    pos=pd.DataFrame(detect_segments(close_prices,df['datetime']))
    if pos.empty: sys.exit("[!] No positive segments found.")
    optimal=find_optimal_segments(pos,close_prices).reset_index(drop=True)
    if optimal.empty: sys.exit("[!] No optimal path found.")

    # negatives from gaps
    negatives=build_negative_segments(optimal,close_prices,df)

    # save JSONs
    opt_json=[{
        "segment_id":i, "segment_type":"optimal",
        "start_index":int(r['start_index']), "end_index":int(r['end_index']),
        "start_time":str(r['start_time']), "end_time":str(r['end_time']),
        "start_price":round(float(r['start_price']),2),
        "end_price":round(float(r['end_price']),2),
        "pct_change":round(float(r['pct_change']),2),
        "segment_length":int(r['end_index']-r['start_index']+1),
        "columns":INDICATORS_FOR_IDENTITY.copy(),
        "data":[[round(float(df.iloc[k][c]),4) if c in df else None
                 for c in INDICATORS_FOR_IDENTITY]
                for k in range(int(r['start_index']),int(r['end_index'])+1)],
        "is_local_min":bool(r.get('is_local_min',False))
    } for i,r in optimal.iterrows()]
    save_json(opt_json,os.path.join(jdir,"optimal_segments.json"))
    save_json(negatives,os.path.join(jdir,"negative_segments.json"))
    all_sorted=sorted(opt_json+negatives,key=lambda x:x['start_index'])
    save_json(all_sorted,os.path.join(jdir,"all_segments.json"))

    # plot
    fig,ax=plt.subplots(figsize=(16,8))
    x=pd.to_datetime(df['datetime']); ax.plot(x,df['close'],'gray',alpha=0.5)
    for seg in all_sorted:
        s,e=seg['start_index'],seg['end_index']
        col='green' if seg['segment_type']=='optimal' else 'red'
        ax.plot(x[s:e+1],df['close'][s:e+1],color=col,lw=2)
        ax.scatter(x[s],df['close'][s],color=col,s=50)
        ax.scatter(x[e],df['close'][e],color='black',s=30)
    ax.set_title(f"Segmentation: {len(optimal)} Optimal, {len(negatives)} Negative")
    plt.tight_layout(); plt.savefig(os.path.join(outdir,"final_plot.png"),dpi=300)
    plt.close()
