import React from 'react';
import { PostFrame, PostHeader, PostFooter, MidokLogo, PillBadge, Icons } from './primitives';
import ImageSlot from './ImageSlot';

// ─── V1 TEMPLATES (Editorial · Beige · Serif) ───────────────────────────────

export function V1T1({ c, images, tokens, version, onSetImage }) {
  return (
    <PostFrame tokens={tokens} bg={tokens.paper}>
      <PostHeader tokens={tokens} version={version} pillar={c.pillar1} num="01" />
      <div style={{ position:'absolute', top:180, left:72, right:72, bottom:180, display:'flex', gap:48, alignItems:'flex-start' }}>
        <div style={{ flexShrink:0, paddingTop:20 }}>
          <ImageSlot slotKey="v1_t1_selfie" images={images} onSetImage={onSetImage}
            shape="circle" width={320} height={320} tokens={tokens}
            label={'Selfie\n' + (c.t1_name||'Katja').split(' ')[0]} />
          <div style={{ marginTop:24, fontFamily:tokens.mono, fontSize:14, color:tokens.inkMute, textTransform:'uppercase', letterSpacing:1.5 }}>
            {c.t1_tenure}
          </div>
        </div>
        <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center', height:'100%' }}>
          <div style={{ fontFamily:tokens.display, fontSize:64, lineHeight:1.08, color:tokens.ink, fontWeight:400, letterSpacing:-1, fontStyle:'italic' }}>
            <span style={{ color:tokens.sky }}>„</span>
            {c.t1_quote}
            <span style={{ color:tokens.sky }}>"</span>
          </div>
          <div style={{ marginTop:40, display:'flex', alignItems:'center', gap:16 }}>
            <div style={{ width:40, height:2, background:tokens.ink }} />
            <div>
              <div style={{ fontFamily:tokens.text, fontSize:22, fontWeight:600, color:tokens.ink }}>{c.t1_name}</div>
              <div style={{ fontFamily:tokens.text, fontSize:18, color:tokens.inkSoft, marginTop:2 }}>{c.t1_role}</div>
            </div>
          </div>
        </div>
      </div>
      <PostFooter tokens={tokens} version={version} contact={c.contact} />
    </PostFrame>
  );
}

export function V1T2({ c, images, tokens, version, onSetImage }) {
  const people = [
    { name:c.t2_p1, role:c.t2_p1r, slot:'v1_t2_p1' },
    { name:c.t2_p2, role:c.t2_p2r, slot:'v1_t2_p2' },
    { name:c.t2_p3, role:c.t2_p3r, slot:'v1_t2_p3' },
    { name:c.t2_p4, role:c.t2_p4r, slot:'v1_t2_p4' },
    { name:c.t2_p5, role:c.t2_p5r, slot:'v1_t2_p5' },
    { name:c.t2_p6, role:c.t2_p6r, slot:'v1_t2_p6' },
  ];
  return (
    <PostFrame tokens={tokens} bg={tokens.paper}>
      <PostHeader tokens={tokens} version={version} pillar={c.pillar1} num="02" />
      <div style={{ position:'absolute', top:180, left:72, right:72 }}>
        <div style={{ fontFamily:tokens.mono, fontSize:13, color:tokens.inkMute, letterSpacing:2, textTransform:'uppercase', marginBottom:12 }}>{c.t2_meta}</div>
        <div style={{ fontFamily:tokens.display, fontSize:80, lineHeight:0.95, color:tokens.ink, letterSpacing:-2, fontStyle:'italic', fontWeight:400 }}>
          {c.t2_headline_a}<br />
          <span style={{ color:tokens.marine }}>{c.t2_headline_b}</span>
        </div>
      </div>
      <div style={{ position:'absolute', bottom:160, left:72, right:72 }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:20 }}>
          {people.map((p,i) => (
            <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
              <ImageSlot slotKey={p.slot} images={images} onSetImage={onSetImage}
                shape="circle" width={130} height={130} tokens={tokens} label={'Selfie\n'+p.name} />
              <div style={{ textAlign:'center' }}>
                <div style={{ fontFamily:tokens.text, fontSize:18, fontWeight:600, color:tokens.ink }}>{p.name}</div>
                <div style={{ fontFamily:tokens.mono, fontSize:11, color:tokens.inkMute, marginTop:2, letterSpacing:0.5 }}>{p.role}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop:28, fontFamily:tokens.text, fontSize:20, color:tokens.inkSoft, maxWidth:720, lineHeight:1.5 }}>{c.t2_sub}</div>
      </div>
      <PostFooter tokens={tokens} version={version} contact={c.contact} />
    </PostFrame>
  );
}

export function V1T3({ c, images, tokens, version, onSetImage }) {
  return (
    <PostFrame tokens={tokens} bg={tokens.paper}>
      <div style={{ position:'absolute', left:0, top:0, bottom:0, width:280, background:tokens.paperDeep }} />
      <PostHeader tokens={tokens} version={version} pillar={c.pillar1} num="03" />
      <div style={{ position:'absolute', top:200, left:40, width:200 }}>
        <ImageSlot slotKey="v1_t3_selfie" images={images} onSetImage={onSetImage}
          shape="circle" width={200} height={200} tokens={tokens}
          label={'Selfie\n'+(c.t3_name||'Roland').split(' ')[0]} />
        <div style={{ marginTop:20, fontFamily:tokens.text, fontSize:20, fontWeight:600, color:tokens.ink }}>{c.t3_name}</div>
        <div style={{ marginTop:4, fontFamily:tokens.mono, fontSize:11, color:tokens.inkMute, letterSpacing:1, textTransform:'uppercase' }}>{c.t3_role}</div>
      </div>
      <div style={{ position:'absolute', top:200, left:340, right:72, bottom:160 }}>
        <div style={{ fontFamily:tokens.mono, fontSize:13, color:tokens.marine, letterSpacing:2, textTransform:'uppercase', marginBottom:20, fontWeight:600 }}>{c.t3_eyebrow}</div>
        <div style={{ fontFamily:tokens.display, fontSize:34, lineHeight:1.2, color:tokens.marine, fontStyle:'italic', marginBottom:32, fontWeight:400 }}>{c.t3_question}</div>
        <div style={{ width:60, height:2, background:tokens.sky, marginBottom:32 }} />
        <div style={{ fontFamily:tokens.text, fontSize:24, lineHeight:1.5, color:tokens.ink, fontWeight:400 }}>{c.t3_answer}</div>
      </div>
      <PostFooter tokens={tokens} version={version} contact={c.contact} />
    </PostFrame>
  );
}

export function V1S1({ c, images, tokens, version, onSetImage }) {
  const steps = [
    { label:c.s1_step1, note:c.s1_step1n },
    { label:c.s1_step2, note:c.s1_step2n },
    { label:c.s1_step3, note:c.s1_step3n },
    { label:c.s1_step4, note:c.s1_step4n },
    { label:c.s1_step5, note:c.s1_step5n },
  ];
  return (
    <PostFrame tokens={tokens} bg={tokens.paper}>
      <PostHeader tokens={tokens} version={version} pillar={c.pillar2} num="04" />
      <div style={{ position:'absolute', top:180, left:72, right:72 }}>
        <div style={{ fontFamily:tokens.mono, fontSize:13, color:tokens.inkMute, letterSpacing:2, textTransform:'uppercase', marginBottom:20 }}>{c.s1_meta}</div>
        <div style={{ fontFamily:tokens.display, fontSize:72, lineHeight:1.05, color:tokens.ink, letterSpacing:-1.5, fontStyle:'italic', fontWeight:400 }}>
          {c.s1_headline_a}<br /><span style={{ color:tokens.marine }}>{c.s1_headline_b}</span>
        </div>
      </div>
      <div style={{ position:'absolute', bottom:190, left:72, right:72 }}>
        <div style={{ position:'relative', height:180 }}>
          <div style={{ position:'absolute', top:30, left:40, right:40, height:1, background:tokens.line }} />
          <div style={{ position:'relative', display:'flex', justifyContent:'space-between' }}>
            {steps.map((s,i) => (
              <div key={i} style={{ width:150, display:'flex', flexDirection:'column', alignItems:'center' }}>
                <div style={{
                  width:60, height:60, borderRadius:'50%',
                  background: i===steps.length-1 ? tokens.marine : tokens.paper,
                  border:`1.5px solid ${i===steps.length-1 ? tokens.marine : tokens.ink}`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontFamily:tokens.mono, fontSize:18, fontWeight:600,
                  color: i===steps.length-1 ? '#fff' : tokens.ink,
                  marginBottom:20,
                }}>
                  {String(i+1).padStart(2,'0')}
                </div>
                <div style={{ fontFamily:tokens.text, fontSize:16, fontWeight:600, color:tokens.ink, textAlign:'center', lineHeight:1.25 }}>{s.label}</div>
                <div style={{ fontFamily:tokens.mono, fontSize:11, color:tokens.inkMute, marginTop:8, letterSpacing:0.5, textTransform:'uppercase' }}>{s.note}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <PostFooter tokens={tokens} version={version} contact={c.contact} meta={c.s1_footer} />
    </PostFrame>
  );
}

export function V1S2({ c, images, tokens, version, onSetImage }) {
  return (
    <PostFrame tokens={tokens} bg={tokens.paper}>
      <PostHeader tokens={tokens} version={version} pillar={c.pillar2} num="05" />
      <div style={{ position:'absolute', top:260, left:72, right:72 }}>
        <div style={{ fontFamily:tokens.display, fontSize:340, lineHeight:0.82, color:tokens.marine, letterSpacing:-10, fontStyle:'italic', fontWeight:400 }}>
          {c.s2_date}
        </div>
      </div>
      <div style={{ position:'absolute', bottom:160, left:72, right:72, display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
        <div style={{ maxWidth:580 }}>
          <div style={{ fontFamily:tokens.text, fontSize:28, lineHeight:1.35, color:tokens.ink, fontWeight:500 }}>{c.s2_sub_editorial}</div>
        </div>
        <div style={{ fontFamily:tokens.mono, fontSize:12, color:tokens.inkMute, textTransform:'uppercase', letterSpacing:1.5, textAlign:'right' }}>
          Tick<br />Tack
        </div>
      </div>
      <PostFooter tokens={tokens} version={version} contact={c.contact} />
    </PostFrame>
  );
}

export function V1S3({ c, images, tokens, version, onSetImage }) {
  return (
    <PostFrame tokens={tokens} bg={tokens.marineDeep}>
      <PostHeader tokens={tokens} version={version} pillar={c.pillar2} num="06" darkBg />
      <div style={{ position:'absolute', top:280, left:72, right:72 }}>
        <div style={{ fontFamily:tokens.mono, fontSize:14, color:tokens.sky, letterSpacing:2, textTransform:'uppercase', marginBottom:28 }}>
          {c.s3_meta}
        </div>
        <div style={{ fontFamily:tokens.display, fontSize:130, lineHeight:0.92, color:'#fff', letterSpacing:-4, fontWeight:400 }}>
          {c.s3_line1}
        </div>
        <div style={{ fontFamily:tokens.display, fontSize:130, lineHeight:0.92, color:tokens.sky, letterSpacing:-4, fontStyle:'italic', fontWeight:400, marginTop:8 }}>
          {c.s3_line2}
        </div>
      </div>
      <div style={{ position:'absolute', bottom:160, left:72, right:72, display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
        <div style={{ fontFamily:tokens.text, fontSize:22, color:'rgba(255,255,255,0.8)', maxWidth:620, lineHeight:1.4 }}>{c.s3_sub}</div>
        <div style={{ display:'flex', alignItems:'center', gap:14, fontFamily:tokens.mono, fontSize:14, color:tokens.sky, letterSpacing:2, textTransform:'uppercase' }}>
          Swipe <span style={{ fontSize:28, letterSpacing:0 }}>→</span>
        </div>
      </div>
    </PostFrame>
  );
}

export function V1B1({ c, images, tokens, version, onSetImage }) {
  return (
    <PostFrame tokens={tokens} bg={tokens.paper}>
      <PostHeader tokens={tokens} version={version} pillar={c.pillar3} num="07" />
      <div style={{ position:'absolute', top:180, left:72, right:72, height:460 }}>
        <ImageSlot slotKey="v1_b1_photo" images={images} onSetImage={onSetImage}
          width="100%" height="100%" tokens={tokens} label="Kundenfoto · Sondermaschine" />
        <div style={{ position:'absolute', top:20, left:20, background:tokens.marine, color:'#fff', fontFamily:tokens.mono, fontSize:12, letterSpacing:1.5, textTransform:'uppercase', padding:'6px 12px' }}>
          {c.b2_caseNr}
        </div>
      </div>
      <div style={{ position:'absolute', top:680, left:72, right:72 }}>
        <div style={{ fontFamily:tokens.display, fontSize:48, lineHeight:1.1, color:tokens.ink, letterSpacing:-0.8, fontStyle:'italic', fontWeight:400, marginBottom:24 }}>
          {c.b2_title}<br /><span style={{ color:tokens.marine }}>{c.b2_customer}</span>
        </div>
      </div>
      <div style={{ position:'absolute', bottom:140, left:72, right:72 }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:32, paddingTop:24, borderTop:`1px solid ${tokens.line}` }}>
          {[
            { n:c.b2_stat1, l:c.b2_stat1l },
            { n:c.b2_stat2, l:c.b2_stat2l },
            { n:c.b2_stat3, l:c.b2_stat3l },
          ].map((k,i) => (
            <div key={i}>
              <div style={{ fontFamily:tokens.display, fontSize:46, color:tokens.marine, fontStyle:'italic', fontWeight:400, letterSpacing:-1 }}>{k.n}</div>
              <div style={{ fontFamily:tokens.mono, fontSize:11, color:tokens.inkMute, textTransform:'uppercase', letterSpacing:1.2, marginTop:4 }}>{k.l}</div>
            </div>
          ))}
        </div>
      </div>
      <PostFooter tokens={tokens} version={version} contact={c.contact} />
    </PostFrame>
  );
}

export function V1B2({ c, images, tokens, version, onSetImage }) {
  return (
    <PostFrame tokens={tokens} bg={tokens.paper}>
      <PostHeader tokens={tokens} version={version} pillar={c.pillar3} num="08" />
      <div style={{ position:'absolute', top:200, left:72, right:72 }}>
        <div style={{ fontFamily:tokens.mono, fontSize:13, color:tokens.inkMute, letterSpacing:2, textTransform:'uppercase', marginBottom:12 }}>Kundenstimme</div>
      </div>
      <div style={{ position:'absolute', top:260, left:72, right:72 }}>
        <div style={{ fontFamily:tokens.display, fontSize:64, lineHeight:1.12, color:tokens.ink, fontStyle:'italic', fontWeight:400, letterSpacing:-1.2 }}>
          <span style={{ color:tokens.sky, fontSize:110, lineHeight:0, verticalAlign:'-0.25em', marginRight:8 }}>„</span>
          {c.b3_quote}
        </div>
      </div>
      <div style={{ position:'absolute', bottom:160, left:72, right:72, display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
        <div style={{ display:'flex', alignItems:'center', gap:20 }}>
          <ImageSlot slotKey="v1_b2_logo" images={images} onSetImage={onSetImage}
            width={80} height={80} tokens={tokens} label="Logo" />
          <div>
            <div style={{ fontFamily:tokens.text, fontSize:22, fontWeight:600, color:tokens.ink }}>{c.b3_name}</div>
            <div style={{ fontFamily:tokens.text, fontSize:18, color:tokens.inkSoft, marginTop:2 }}>{c.b3_role}</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:3, alignItems:'center' }}>
          {[0,1,2,3,4].map(i => (
            <div key={i} style={{ width:14, height:14, background:tokens.marine, borderRadius:1, transform:'rotate(45deg)' }} />
          ))}
        </div>
      </div>
      <PostFooter tokens={tokens} version={version} contact={c.contact} />
    </PostFrame>
  );
}

export function V1B3({ c, images, tokens, version, onSetImage }) {
  const rows = [
    [c.b3_row1_label, c.b3_row1_before, c.b3_row1_after],
    [c.b3_row2_label, c.b3_row2_before, c.b3_row2_after],
    [c.b3_row3_label, c.b3_row3_before, c.b3_row3_after],
    [c.b3_row4_label, c.b3_row4_before, c.b3_row4_after],
    [c.b3_row5_label, c.b3_row5_before, c.b3_row5_after],
  ];
  return (
    <PostFrame tokens={tokens} bg={tokens.paper}>
      <PostHeader tokens={tokens} version={version} pillar={c.pillar3} num="09" />
      <div style={{ position:'absolute', top:180, left:72, right:72 }}>
        <div style={{ fontFamily:tokens.mono, fontSize:13, color:tokens.inkMute, letterSpacing:2, textTransform:'uppercase', marginBottom:12 }}>Projektbilanz · 4 Wochen</div>
        <div style={{ fontFamily:tokens.display, fontSize:76, lineHeight:1, color:tokens.ink, letterSpacing:-1.5, fontStyle:'italic', fontWeight:400 }}>
          Vorher. <span style={{ color:tokens.marine }}>Nachher.</span>
        </div>
      </div>
      <div style={{ position:'absolute', top:420, left:72, right:72, bottom:160 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1.1fr 1fr auto 1fr', borderTop:`1.5px solid ${tokens.ink}`, paddingTop:16, fontFamily:tokens.mono, fontSize:11, color:tokens.inkMute, textTransform:'uppercase', letterSpacing:1.2, marginBottom:8 }}>
          <div /><div>Vorher</div><div /><div>Nachher</div>
        </div>
        {rows.map((r,i) => (
          <div key={i} style={{ display:'grid', gridTemplateColumns:'1.1fr 1fr auto 1fr', padding:'18px 0', borderBottom:`1px solid ${tokens.line}`, alignItems:'center' }}>
            <div style={{ fontFamily:tokens.text, fontSize:22, fontWeight:600, color:tokens.ink }}>{r[0]}</div>
            <div style={{ fontFamily:tokens.text, fontSize:20, color:tokens.inkSoft, textDecoration:'line-through', textDecorationColor:tokens.inkMute }}>{r[1]}</div>
            <div style={{ fontFamily:tokens.mono, fontSize:22, color:tokens.sky, padding:'0 20px' }}>→</div>
            <div style={{ fontFamily:tokens.text, fontSize:20, color:tokens.marine, fontWeight:500 }}>{r[2]}</div>
          </div>
        ))}
      </div>
      <PostFooter tokens={tokens} version={version} contact={c.contact} />
    </PostFrame>
  );
}

// ─── V2 TEMPLATES (Sans · Weiß · Corporate) ─────────────────────────────────

export function V2T1({ c, images, tokens, version, onSetImage }) {
  const stats = [
    { n:c.t1_stat1_n, l:c.t1_stat1_l, Icon:Icons.Shield },
    { n:c.t1_stat2_n, l:c.t1_stat2_l, Icon:Icons.Smile },
    { n:c.t1_stat3_n, l:c.t1_stat3_l, Icon:Icons.CE },
    { n:c.t1_stat4_n, l:c.t1_stat4_l, Icon:Icons.Book },
  ];
  return (
    <PostFrame tokens={tokens} bg={tokens.paper}>
      <PostHeader tokens={tokens} version={version} pillar={c.pillar1} num="01" />
      <div style={{ position:'absolute', top:180, left:72, right:72 }}>
        <div style={{ fontFamily:tokens.text, fontSize:72, lineHeight:1.05, color:tokens.ink, fontWeight:700, letterSpacing:-2 }}>
          {c.t1_headline_a}<br /><span style={{ color:tokens.marine }}>{c.t1_headline_b}</span>
        </div>
        <div style={{ marginTop:20, fontFamily:tokens.text, fontSize:22, color:tokens.inkSoft, lineHeight:1.5, maxWidth:780 }}>{c.t1_sub}</div>
      </div>
      <div style={{ position:'absolute', bottom:150, left:72, right:72 }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:24 }}>
          {stats.map((s,i) => (
            <div key={i} style={{ background:tokens.paperDeep, border:`1px solid ${tokens.line}`, padding:'28px 24px', borderRadius:8 }}>
              <s.Icon size={36} color={tokens.marine} />
              <div style={{ fontFamily:tokens.text, fontSize:44, fontWeight:800, color:tokens.ink, marginTop:18, letterSpacing:-1 }}>{s.n}</div>
              <div style={{ fontFamily:tokens.text, fontSize:14, color:tokens.inkSoft, marginTop:6, lineHeight:1.35 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>
      <PostFooter tokens={tokens} version={version} contact={c.contact} />
    </PostFrame>
  );
}

export function V2T2({ c, images, tokens, version, onSetImage }) {
  return (
    <PostFrame tokens={tokens} bg={tokens.paper}>
      <PostHeader tokens={tokens} version={version} pillar={c.pillar1} num="02" />
      <div style={{ position:'absolute', top:180, left:72, right:500 }}>
        <div style={{ fontFamily:tokens.text, fontSize:15, color:tokens.marine, fontWeight:700, letterSpacing:2, textTransform:'uppercase', marginBottom:20 }}>{c.t2_eyebrow}</div>
        <div style={{ fontFamily:tokens.text, fontSize:60, lineHeight:1.08, color:tokens.ink, fontWeight:700, letterSpacing:-1.5 }}>{c.t2_portrait_name}</div>
        <div style={{ fontFamily:tokens.text, fontSize:22, color:tokens.inkSoft, marginTop:8, fontWeight:500 }}>{c.t2_portrait_role}</div>
        <div style={{ height:2, background:tokens.sky, width:60, margin:'40px 0' }} />
        <div style={{ fontFamily:tokens.text, fontSize:24, lineHeight:1.5, color:tokens.ink, fontWeight:400 }}>„{c.t2_portrait_quote}"</div>
        <div style={{ marginTop:40, display:'flex', gap:12, flexWrap:'wrap' }}>
          {[c.t2_tag1, c.t2_tag2, c.t2_tag3].filter(Boolean).map((tag,i) => (
            <PillBadge key={i} tokens={tokens} bg={tokens.skyPale} color={tokens.marine}>{tag}</PillBadge>
          ))}
        </div>
      </div>
      <div style={{ position:'absolute', top:180, right:72, width:380, height:680 }}>
        <ImageSlot slotKey="v2_t2_portrait" images={images} onSetImage={onSetImage}
          width={380} height={680} tokens={tokens} label={'Portrait\n(optional Selfie)'} shape="rounded" />
      </div>
      <PostFooter tokens={tokens} version={version} contact={c.contact} />
    </PostFrame>
  );
}

export function V2T3({ c, images, tokens, version, onSetImage }) {
  return (
    <PostFrame tokens={tokens} bg={tokens.paperDeep}>
      <PostHeader tokens={tokens} version={version} pillar={c.pillar1} num="03" />
      <div style={{ position:'absolute', top:280, left:72, right:72, textAlign:'center' }}>
        <div style={{ fontFamily:tokens.text, fontSize:15, color:tokens.marine, fontWeight:700, letterSpacing:2, textTransform:'uppercase', marginBottom:32 }}>{c.t3_eyebrow}</div>
        <div style={{ display:'inline-block', position:'relative' }}>
          <div style={{ fontFamily:tokens.text, fontSize:280, lineHeight:0.9, color:tokens.marine, fontWeight:800, letterSpacing:-12 }}>{c.t3_years}</div>
          <div style={{ position:'absolute', bottom:30, right:-80, fontFamily:tokens.text, fontSize:48, color:tokens.sky, fontWeight:700 }}>{c.t3_yearsLabel}</div>
        </div>
        <div style={{ fontFamily:tokens.text, fontSize:48, color:tokens.ink, fontWeight:700, letterSpacing:-0.5, marginTop:40 }}>{c.t3_name}</div>
        <div style={{ fontFamily:tokens.text, fontSize:22, color:tokens.inkSoft, marginTop:8 }}>{c.t3_role}</div>
      </div>
      <PostFooter tokens={tokens} version={version} contact={c.contact} />
    </PostFrame>
  );
}

export function V2S1({ c, images, tokens, version, onSetImage }) {
  return (
    <PostFrame tokens={tokens} bg={tokens.paper}>
      <PostHeader tokens={tokens} version={version} pillar={c.pillar2} num="04" />
      <div style={{ position:'absolute', top:180, left:72, right:72 }}>
        <div style={{ fontFamily:tokens.mono, fontSize:14, color:tokens.inkMute, letterSpacing:1, marginBottom:16 }}>{c.s1_meta}</div>
        <div style={{ fontFamily:tokens.text, fontSize:88, lineHeight:1, color:tokens.ink, fontWeight:800, letterSpacing:-2.5 }}>{c.s1_term}</div>
        <div style={{ fontFamily:tokens.text, fontSize:22, color:tokens.marine, marginTop:12, fontWeight:500 }}>{c.s1_norm}</div>
      </div>
      <div style={{ position:'absolute', top:540, left:72, right:72, bottom:150 }}>
        <div style={{ background:tokens.paperDeep, border:`1px solid ${tokens.line}`, borderLeft:`4px solid ${tokens.sky}`, padding:'32px 36px', borderRadius:4, marginBottom:20 }}>
          <div style={{ fontFamily:tokens.text, fontSize:14, fontWeight:700, color:tokens.marine, textTransform:'uppercase', letterSpacing:1.5, marginBottom:10 }}>Definition</div>
          <div style={{ fontFamily:tokens.text, fontSize:22, lineHeight:1.5, color:tokens.ink }}>{c.s1_def}</div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <div style={{ background:tokens.paperDeep, border:`1px solid ${tokens.line}`, padding:'24px 28px', borderRadius:4 }}>
            <div style={{ fontFamily:tokens.text, fontSize:13, fontWeight:700, color:tokens.marine, textTransform:'uppercase', letterSpacing:1.5, marginBottom:8 }}>{c.s1_box1_title}</div>
            <div style={{ fontFamily:tokens.text, fontSize:18, color:tokens.ink, lineHeight:1.45 }}>{c.s1_box1_body}</div>
          </div>
          <div style={{ background:tokens.paperDeep, border:`1px solid ${tokens.line}`, padding:'24px 28px', borderRadius:4 }}>
            <div style={{ fontFamily:tokens.text, fontSize:13, fontWeight:700, color:tokens.marine, textTransform:'uppercase', letterSpacing:1.5, marginBottom:8 }}>{c.s1_box2_title}</div>
            <div style={{ fontFamily:tokens.text, fontSize:18, color:tokens.ink, lineHeight:1.45 }}>{c.s1_box2_body}</div>
          </div>
        </div>
      </div>
      <PostFooter tokens={tokens} version={version} contact={c.contact} />
    </PostFrame>
  );
}

export function V2S2({ c, images, tokens, version, onSetImage }) {
  return (
    <PostFrame tokens={tokens} bg={tokens.paper}>
      <PostHeader tokens={tokens} version={version} pillar={c.pillar2} num="05" />
      <div style={{ position:'absolute', top:180, left:72, right:72 }}>
        <div style={{ fontFamily:tokens.text, fontSize:15, color:tokens.marine, fontWeight:700, letterSpacing:2, textTransform:'uppercase', marginBottom:16 }}>{c.s2_eyebrow}</div>
        <div style={{ fontFamily:tokens.text, fontSize:64, lineHeight:1.05, color:tokens.ink, fontWeight:800, letterSpacing:-1.8 }}>
          {c.s2_headline_a}<br /><span style={{ color:tokens.marine }}>{c.s2_headline_b}</span> {c.s2_headline_c}
        </div>
      </div>
      <div style={{ position:'absolute', top:580, left:72, right:72 }}>
        <div style={{ background:tokens.marine, color:'#fff', padding:'48px 56px', borderRadius:12, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontFamily:tokens.text, fontSize:14, letterSpacing:2, textTransform:'uppercase', color:tokens.sky, fontWeight:700, marginBottom:12 }}>Stichtag</div>
            <div style={{ fontFamily:tokens.text, fontSize:88, lineHeight:1, fontWeight:800, letterSpacing:-3 }}>
              {c.s2_dateA}<span style={{ color:tokens.sky }}>{c.s2_dateB}</span>
            </div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontFamily:tokens.text, fontSize:64, fontWeight:800, color:tokens.sky, letterSpacing:-2 }}>{c.s2_countdown}</div>
            <div style={{ fontFamily:tokens.text, fontSize:16, color:'rgba(255,255,255,0.8)', letterSpacing:1, textTransform:'uppercase', marginTop:4 }}>{c.s2_countdownL}</div>
          </div>
        </div>
        <div style={{ marginTop:24, fontFamily:tokens.text, fontSize:20, color:tokens.inkSoft, lineHeight:1.5 }}>{c.s2_cta}</div>
      </div>
      <PostFooter tokens={tokens} version={version} contact={c.contact} />
    </PostFrame>
  );
}

export function V2S3({ c, images, tokens, version, onSetImage }) {
  return (
    <PostFrame tokens={tokens} bg={tokens.marineDeep}>
      <PostHeader tokens={tokens} version={version} pillar={c.pillar2} num="06" darkBg badgeBg={tokens.sky} badgeColor={tokens.marine} />
      <div style={{ position:'absolute', top:260, left:72, right:72 }}>
        <div style={{ fontFamily:tokens.mono, fontSize:14, color:tokens.sky, letterSpacing:2, textTransform:'uppercase', marginBottom:28, fontWeight:500 }}>{c.s3_meta}</div>
        <div style={{ fontFamily:tokens.text, fontSize:120, lineHeight:1.0, color:'#fff', fontWeight:800, letterSpacing:-4 }}>
          {c.s3_line1}<br />{c.s3_line2}<br />
          <span style={{ color:tokens.sky }}>{c.s3_line3}</span><br />
          {c.s3_line4}
        </div>
      </div>
      <div style={{ position:'absolute', bottom:140, left:72, right:72, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <MidokLogo tokens={tokens} size={24} color="#fff" dot={tokens.sky} />
        <div style={{ display:'flex', gap:6 }}>
          {[0,1,2,3,4].map(i => (
            <div key={i} style={{ width:40, height:4, background: i===0 ? tokens.sky : 'rgba(255,255,255,0.3)' }} />
          ))}
        </div>
      </div>
    </PostFrame>
  );
}

export function V2B1({ c, images, tokens, version, onSetImage }) {
  const kunden = [
    { n:c.b1_k1_n, s:c.b1_k1_s },
    { n:c.b1_k2_n, s:c.b1_k2_s },
    { n:c.b1_k3_n, s:c.b1_k3_s },
    { n:c.b1_k4_n, s:c.b1_k4_s },
    { n:c.b1_k5_n, s:c.b1_k5_s },
    { n:c.b1_k6_n, s:c.b1_k6_s },
  ];
  return (
    <PostFrame tokens={tokens} bg={tokens.paper}>
      <PostHeader tokens={tokens} version={version} pillar={c.pillar3} num="07" />
      <div style={{ position:'absolute', top:180, left:72, right:72 }}>
        <div style={{ fontFamily:tokens.text, fontSize:15, color:tokens.marine, fontWeight:700, letterSpacing:2, textTransform:'uppercase', marginBottom:16 }}>{c.b1_eyebrow}</div>
        <div style={{ fontFamily:tokens.text, fontSize:68, lineHeight:1.05, color:tokens.ink, fontWeight:800, letterSpacing:-1.8 }}>
          {c.b1_headline_a}<br /><span style={{ color:tokens.marine }}>{c.b1_headline_b}</span>
        </div>
      </div>
      <div style={{ position:'absolute', bottom:150, left:72, right:72 }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
          {kunden.map((k,i) => (
            <div key={i} style={{ background:tokens.paperDeep, border:`1px solid ${tokens.line}`, padding:'36px 32px', borderRadius:8, height:140, display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
              <div style={{ fontFamily:tokens.text, fontSize:28, fontWeight:800, color:tokens.ink, letterSpacing:-0.5 }}>{k.n}</div>
              <div style={{ fontFamily:tokens.text, fontSize:13, color:tokens.inkMute, fontWeight:500 }}>{k.s}</div>
            </div>
          ))}
        </div>
      </div>
      <PostFooter tokens={tokens} version={version} contact={c.contact} />
    </PostFrame>
  );
}

export function V2B2({ c, images, tokens, version, onSetImage }) {
  const kpis = [
    { n:c.b2_k1_n, l:c.b2_k1_l },
    { n:c.b2_k2_n, l:c.b2_k2_l },
    { n:c.b2_k3_n, l:c.b2_k3_l },
    { n:c.b2_k4_n, l:c.b2_k4_l },
  ];
  return (
    <PostFrame tokens={tokens} bg={tokens.paper}>
      <PostHeader tokens={tokens} version={version} pillar={c.pillar3} num="08" />
      <div style={{ position:'absolute', top:180, left:72, width:440, height:460 }}>
        <ImageSlot slotKey="v2_b2_photo" images={images} onSetImage={onSetImage}
          width={440} height={460} tokens={tokens} label="Maschinenfoto" shape="rounded" />
        <div style={{ position:'absolute', bottom:20, left:20, background:'#fff', padding:'10px 14px', borderRadius:4, fontFamily:tokens.text, fontSize:13, fontWeight:700, color:tokens.marine, letterSpacing:1, textTransform:'uppercase' }}>
          {c.b2_caseNr}
        </div>
      </div>
      <div style={{ position:'absolute', top:180, right:72, width:440 }}>
        <div style={{ fontFamily:tokens.text, fontSize:15, color:tokens.marine, fontWeight:700, letterSpacing:2, textTransform:'uppercase', marginBottom:12 }}>{c.b2_eyebrow}</div>
        <div style={{ fontFamily:tokens.text, fontSize:44, lineHeight:1.1, color:tokens.ink, fontWeight:800, letterSpacing:-1 }}>{c.b2_title}</div>
        <div style={{ fontFamily:tokens.text, fontSize:20, color:tokens.inkSoft, marginTop:8, fontWeight:500 }}>{c.b2_customer}</div>
        <div style={{ height:1, background:tokens.line, margin:'32px 0' }} />
        <div style={{ fontFamily:tokens.text, fontSize:18, color:tokens.ink, lineHeight:1.5 }}>{c.b2_body}</div>
      </div>
      <div style={{ position:'absolute', bottom:140, left:72, right:72 }}>
        <div style={{ background:tokens.marine, color:'#fff', display:'grid', gridTemplateColumns:'repeat(4,1fr)', padding:'28px 32px', borderRadius:8 }}>
          {kpis.map((k,i) => (
            <div key={i} style={{ borderLeft: i===0 ? 'none' : '1px solid rgba(255,255,255,0.2)', paddingLeft: i===0 ? 0 : 24 }}>
              <div style={{ fontFamily:tokens.text, fontSize:48, fontWeight:800, letterSpacing:-1, color: k.n==='✓' ? tokens.sky : '#fff' }}>{k.n}</div>
              <div style={{ fontFamily:tokens.text, fontSize:13, color:'rgba(255,255,255,0.7)', letterSpacing:1.2, textTransform:'uppercase', marginTop:4 }}>{k.l}</div>
            </div>
          ))}
        </div>
      </div>
      <PostFooter tokens={tokens} version={version} contact={c.contact} />
    </PostFrame>
  );
}

export function V2B3({ c, images, tokens, version, onSetImage }) {
  return (
    <PostFrame tokens={tokens} bg={tokens.paper}>
      <PostHeader tokens={tokens} version={version} pillar={c.pillar3} num="09" />
      <div style={{ position:'absolute', top:220, left:72, right:72 }}>
        <div style={{ fontFamily:tokens.text, fontSize:130, lineHeight:0.6, color:tokens.sky, fontWeight:800 }}>"</div>
        <div style={{ fontFamily:tokens.text, fontSize:44, lineHeight:1.3, color:tokens.ink, fontWeight:600, letterSpacing:-0.8, marginTop:0 }}>
          {c.b3_quote}
        </div>
      </div>
      <div style={{ position:'absolute', bottom:160, left:72, right:72 }}>
        <div style={{ height:1, background:tokens.line, marginBottom:28 }} />
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ display:'flex', alignItems:'center', gap:20 }}>
            <div style={{ width:72, height:72, borderRadius:8, background:tokens.paperDeep, border:`1px solid ${tokens.line}`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:tokens.text, fontSize:14, fontWeight:800, color:tokens.marine, letterSpacing:-0.5 }}>
              {c.b3_logoChip}
            </div>
            <div>
              <div style={{ fontFamily:tokens.text, fontSize:22, fontWeight:700, color:tokens.ink }}>{c.b3_name}</div>
              <div style={{ fontFamily:tokens.text, fontSize:16, color:tokens.inkSoft, marginTop:2 }}>{c.b3_role}</div>
            </div>
          </div>
          <MidokLogo tokens={tokens} size={22} />
        </div>
      </div>
      <PostFooter tokens={tokens} version={version} contact={c.contact} />
    </PostFrame>
  );
}

// ─── Template registry ──────────────────────────────────────────────────────

export const TEMPLATES = [
  { id:'v1t1', versionId:'v1', pillar:1, label:'T.01 · Team-Zitat',           component:V1T1, imageSlots:['v1_t1_selfie'] },
  { id:'v1t2', versionId:'v1', pillar:1, label:'T.02 · Team-Grid',            component:V1T2, imageSlots:['v1_t2_p1','v1_t2_p2','v1_t2_p3','v1_t2_p4','v1_t2_p5','v1_t2_p6'] },
  { id:'v1t3', versionId:'v1', pillar:1, label:'T.03 · Interview',            component:V1T3, imageSlots:['v1_t3_selfie'] },
  { id:'v1s1', versionId:'v1', pillar:2, label:'S.01 · Diagramm',             component:V1S1, imageSlots:[] },
  { id:'v1s2', versionId:'v1', pillar:2, label:'S.02 · Datum/Deadline',       component:V1S2, imageSlots:[] },
  { id:'v1s3', versionId:'v1', pillar:2, label:'S.03 · Karussell-Cover',      component:V1S3, imageSlots:[] },
  { id:'v1b1', versionId:'v1', pillar:3, label:'B.01 · Case Study',           component:V1B1, imageSlots:['v1_b1_photo'] },
  { id:'v1b2', versionId:'v1', pillar:3, label:'B.02 · Kundenzitat',          component:V1B2, imageSlots:['v1_b2_logo'] },
  { id:'v1b3', versionId:'v1', pillar:3, label:'B.03 · Vorher / Nachher',     component:V1B3, imageSlots:[] },
  { id:'v2t1', versionId:'v2', pillar:1, label:'T.01 · Trust-Zahlen',         component:V2T1, imageSlots:[] },
  { id:'v2t2', versionId:'v2', pillar:1, label:'T.02 · Mitarbeiter-Portrait', component:V2T2, imageSlots:['v2_t2_portrait'] },
  { id:'v2t3', versionId:'v2', pillar:1, label:'T.03 · Jubiläum',             component:V2T3, imageSlots:[] },
  { id:'v2s1', versionId:'v2', pillar:2, label:'S.01 · Fachbegriff',          component:V2S1, imageSlots:[] },
  { id:'v2s2', versionId:'v2', pillar:2, label:'S.02 · Deadline',             component:V2S2, imageSlots:[] },
  { id:'v2s3', versionId:'v2', pillar:2, label:'S.03 · Karussell-Cover',      component:V2S3, imageSlots:[] },
  { id:'v2b1', versionId:'v2', pillar:3, label:'B.01 · Kunden-Wall',          component:V2B1, imageSlots:[] },
  { id:'v2b2', versionId:'v2', pillar:3, label:'B.02 · Case Study',           component:V2B2, imageSlots:['v2_b2_photo'] },
  { id:'v2b3', versionId:'v2', pillar:3, label:'B.03 · Kundenzitat',          component:V2B3, imageSlots:[] },
];
