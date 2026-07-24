import { Node, Edge } from 'reactflow';

export interface FamilyNodeData {
  label: string;
  branch: 'dominik' | 'siudzinski' | 'franciszek' | 'leon' | 'main' | 'zygler' | 'other';
  gen: number; // 1 to 6
  role?: string;
  deceased?: boolean;
}

export const initialNodes: (Node & { data: FamilyNodeData })[] = [
  // --- GENERACJA 1: Najstarsi przodkowie ---
  { id: 'walenty', data: { label: 'Walenty', branch: 'franciszek', gen: 1, role: 'Pradziadek' }, position: { x: 0, y: 0 } },
  { id: 'agnieszka', data: { label: 'Agnieszka', branch: 'franciszek', gen: 1, role: 'Prababcia' }, position: { x: 0, y: 0 } },
  { id: 'michal_d', data: { label: 'Michał Dominik', branch: 'dominik', gen: 1, role: 'Najstarszy brat' }, position: { x: 0, y: 0 } },
  { id: 'anna_d', data: { label: 'Anna Dominik', branch: 'dominik', gen: 1, role: 'Prababcia' }, position: { x: 0, y: 0 } },
  { id: 'zofia_d', data: { label: 'Zofia Dominik', branch: 'dominik', gen: 1, role: 'Prababcia' }, position: { x: 0, y: 0 } },
  { id: 'natalia_d', data: { label: 'Natalia Dominik', branch: 'dominik', gen: 1 }, position: { x: 0, y: 0 } },
  { id: 'nn_d', data: { label: 'N.N. Dominikówna', branch: 'dominik', gen: 1, role: 'ur. 1916' }, position: { x: 0, y: 0 } },

  // --- GENERACJA 2: Pradziadkowie / Dziadkowie ---
  { id: 'ojciec_fl', data: { label: 'N.N. Ojciec F. i L.', branch: 'franciszek', gen: 2, role: 'Pochowany w Słomczynie' }, position: { x: 0, y: 0 } },
  { id: 'aleksander_s', data: { label: 'Aleksander Siudziński', branch: 'siudzinski', gen: 2, role: 'Pradziadek' }, position: { x: 0, y: 0 } },
  { id: 'kazimierz_s', data: { label: 'Kazimierz Siudziński', branch: 'siudzinski', gen: 2, role: 'Brat Aleksandra' }, position: { x: 0, y: 0 } },
  { id: 'maz_1', data: { label: 'I mąż N.N.', branch: 'other', gen: 2, role: 'Zaginął w II WŚ' }, position: { x: 0, y: 0 } },
  { id: 'franciszek_w', data: { label: 'Franciszek Wiewióra', branch: 'other', gen: 2, role: 'II mąż N.N.' }, position: { x: 0, y: 0 } },

  // --- GENERACJA 3: Dziadkowie ---
  { id: 'franciszek', data: { label: 'Franciszek', branch: 'franciszek', gen: 3, role: 'Dziadek Franek' }, position: { x: 0, y: 0 } },
  { id: 'f_zona_1', data: { label: 'I żona Franka', branch: 'other', gen: 3, role: 'Zmarła przy porodzie' }, position: { x: 0, y: 0 } },
  { id: 'f_zona_2', data: { label: 'II żona Franka', branch: 'other', gen: 3 }, position: { x: 0, y: 0 } },
  { id: 'f_zona_3', data: { label: 'III żona Franka', branch: 'other', gen: 3 }, position: { x: 0, y: 0 } },
  { id: 'leon', data: { label: 'Leon', branch: 'leon', gen: 3, role: 'Brat Franciszka' }, position: { x: 0, y: 0 } },
  { id: 'janina_s', data: { label: 'Janina Siudzińska', branch: 'siudzinski', gen: 3 }, position: { x: 0, y: 0 } },
  { id: 'jan_a', data: { label: 'Jan Ambroziak †', branch: 'other', gen: 3, deceased: true }, position: { x: 0, y: 0 } },
  { id: 'jerzy_s', data: { label: 'Jerzy Siudziński', branch: 'siudzinski', gen: 3 }, position: { x: 0, y: 0 } },
  { id: 'krystyna_d', data: { label: 'Krystyna z d. Dembińska', branch: 'other', gen: 3 }, position: { x: 0, y: 0 } },
  { id: 'zofia_s', data: { label: 'Zofia Siudzińska', branch: 'siudzinski', gen: 3, role: 'Babcia Zosia' }, position: { x: 0, y: 0 } },
  { id: 'barbara_s', data: { label: 'Barbara z d. Siudzińska', branch: 'siudzinski', gen: 3, role: 'Ciocia Basia' }, position: { x: 0, y: 0 } },
  { id: 'kazimierz_u', data: { label: 'Kazimierz Utrata †', branch: 'other', gen: 3, deceased: true }, position: { x: 0, y: 0 } },
  { id: 'wieslawa_w', data: { label: 'Wiesława Wiewióra', branch: 'dominik', gen: 3, role: 'Wiesia' }, position: { x: 0, y: 0 } },
  { id: 'andrzej_o', data: { label: 'Andrzej Osuch', branch: 'other', gen: 3 }, position: { x: 0, y: 0 } },

  // --- GENERACJA 4: Rodzice / Wujowie ---
  { id: 'marian', data: { label: 'Marian', branch: 'franciszek', gen: 4, role: 'Syn II żony' }, position: { x: 0, y: 0 } },
  { id: 'henryk', data: { label: 'Henryk (Heniek)', branch: 'franciszek', gen: 4, role: 'Posadził kasztan 1936' }, position: { x: 0, y: 0 } },
  { id: 'kazik', data: { label: 'Kazimierz (Kazik)', branch: 'franciszek', gen: 4, role: 'Syn II żony' }, position: { x: 0, y: 0 } },
  { id: 'bolek', data: { label: 'Bolesław (Bolek) †', branch: 'franciszek', gen: 4, role: 'Zginął w Powstaniu', deceased: true }, position: { x: 0, y: 0 } },
  { id: 'wiesia_f', data: { label: 'Wiesława (Wiesia)', branch: 'franciszek', gen: 4, role: 'Córka III żony' }, position: { x: 0, y: 0 } },
  { id: 'tomek', data: { label: 'Tomek', branch: 'other', gen: 4, role: 'ur. 1958' }, position: { x: 0, y: 0 } },
  { id: 'jasiek', data: { label: 'Jan (Jasiek)', branch: 'leon', gen: 4, role: 'Syn Leona' }, position: { x: 0, y: 0 } },
  { id: 'hania', data: { label: 'Hanna (Hania) †', branch: 'siudzinski', gen: 4, role: 'Teściowa', deceased: true }, position: { x: 0, y: 0 } },
  { id: 'jacek', data: { label: 'Jacek', branch: 'other', gen: 4, role: 'Teść' }, position: { x: 0, y: 0 } },
  { id: 'dzieci_jerzego', data: { label: '3 dzieci Jerzego', branch: 'siudzinski', gen: 4 }, position: { x: 0, y: 0 } },
  { id: 'anna_u', data: { label: 'Anna Utrata', branch: 'siudzinski', gen: 4 }, position: { x: 0, y: 0 } },
  { id: 'pawel_u', data: { label: 'Paweł Utrata', branch: 'siudzinski', gen: 4 }, position: { x: 0, y: 0 } },

  // --- GENERACJA 5: Nasze pokolenie ---
  { id: 'pawel', data: { label: 'Paweł (Ty)', branch: 'zygler', gen: 5, role: 'Linia Zyglerów' }, position: { x: 0, y: 0 } },
  { id: 'gosia', data: { label: 'Małgorzata (Gosia)', branch: 'main', gen: 5, role: 'Żona Pawła' }, position: { x: 0, y: 0 } },
  { id: 'marcin', data: { label: 'Marcin', branch: 'siudzinski', gen: 5, role: 'Brat Gosi' }, position: { x: 0, y: 0 } },
  { id: 'marzena_m', data: { label: 'Marzena', branch: 'other', gen: 5, role: 'Żona Marcina' }, position: { x: 0, y: 0 } },
  { id: 'corka_j_1', data: { label: 'Córka Jaśka (I)', branch: 'leon', gen: 5, role: 'Matka Rafała' }, position: { x: 0, y: 0 } },
  { id: 'corka_j_2', data: { label: 'Córka Jaśka (II)', branch: 'leon', gen: 5, role: 'Matka Marzeny' }, position: { x: 0, y: 0 } },
  { id: 'andrzej_j', data: { label: 'Andrzej', branch: 'leon', gen: 5, role: 'Syn Jaśka' }, position: { x: 0, y: 0 } },
  { id: 'teresa', data: { label: 'Teresa †', branch: 'other', gen: 5, role: 'Żona Andrzeja', deceased: true }, position: { x: 0, y: 0 } },

  // --- GENERACJA 6: Dzieci ---
  { id: 'tosia', data: { label: 'Antonina (Tosia)', branch: 'main', gen: 6, role: 'Córka' }, position: { x: 0, y: 0 } },
  { id: 'janek', data: { label: 'Janek', branch: 'main', gen: 6, role: 'Syn' }, position: { x: 0, y: 0 } },
  { id: 'ciri', data: { label: 'Ciri', branch: 'siudzinski', gen: 6, role: 'Córka Marcina' }, position: { x: 0, y: 0 } },
  { id: 'kayla', data: { label: 'Kayla', branch: 'siudzinski', gen: 6, role: 'Córka Marcina' }, position: { x: 0, y: 0 } },
  { id: 'rafal', data: { label: 'Rafał', branch: 'leon', gen: 6, role: 'Wnuk Jaśka' }, position: { x: 0, y: 0 } },
  { id: 'marzena_leon', data: { label: 'Marzena', branch: 'leon', gen: 6, role: 'Wnuczka Jaśka' }, position: { x: 0, y: 0 } },
];

export const initialEdges: Edge[] = [
  // Dominik & Siudzińscy
  { id: 'e_ad_as', source: 'anna_d', target: 'aleksander_s', type: 'step' },
  { id: 'e_zd_ks', source: 'zofia_d', target: 'kazimierz_s', type: 'step' },
  { id: 'e_nnd_m1', source: 'nn_d', target: 'maz_1', type: 'step' },
  { id: 'e_nnd_fw', source: 'nn_d', target: 'franciszek_w', type: 'step' },
  { id: 'e_fw_ww', source: 'franciszek_w', target: 'wieslawa_w', type: 'step' },
  { id: 'e_ww_ao', source: 'wieslawa_w', target: 'andrzej_o', type: 'step' },
  
  { id: 'e_as_js', source: 'aleksander_s', target: 'janina_s', type: 'step' },
  { id: 'e_as_jes', source: 'aleksander_s', target: 'jerzy_s', type: 'step' },
  { id: 'e_as_zs', source: 'aleksander_s', target: 'zofia_s', type: 'step' },
  
  { id: 'e_js_ja', source: 'janina_s', target: 'jan_a', type: 'step' },
  { id: 'e_jes_kd', source: 'jerzy_s', target: 'krystyna_d', type: 'step' },
  { id: 'e_jes_dj', source: 'jerzy_s', target: 'dzieci_jerzego', type: 'step' },
  
  { id: 'e_zs_h', source: 'zofia_s', target: 'hania', type: 'step' },
  { id: 'e_h_j', source: 'hania', target: 'jacek', type: 'step' },
  { id: 'e_h_g', source: 'hania', target: 'gosia', type: 'step' },
  { id: 'e_h_m', source: 'hania', target: 'marcin', type: 'step' },
  { id: 'e_m_mm', source: 'marcin', target: 'marzena_m', type: 'step' },
  { id: 'e_m_c', source: 'marcin', target: 'ciri', type: 'step' },
  { id: 'e_m_k', source: 'marcin', target: 'kayla', type: 'step' },
  
  { id: 'e_g_p', source: 'gosia', target: 'pawel', type: 'step' },
  { id: 'e_g_t', source: 'gosia', target: 'tosia', type: 'step' },
  { id: 'e_p_t', source: 'pawel', target: 'tosia', type: 'step' },
  { id: 'e_g_jk', source: 'gosia', target: 'janek', type: 'step' },
  { id: 'e_p_jk', source: 'pawel', target: 'janek', type: 'step' },
  
  { id: 'e_ks_bs', source: 'kazimierz_s', target: 'barbara_s', type: 'step' },
  { id: 'e_bs_ku', source: 'barbara_s', target: 'kazimierz_u', type: 'step' },
  { id: 'e_bs_au', source: 'barbara_s', target: 'anna_u', type: 'step' },
  { id: 'e_bs_pu', source: 'barbara_s', target: 'pawel_u', type: 'step' },
  
  // Franciszek i Leon
  { id: 'e_w_of', source: 'walenty', target: 'ojciec_fl', type: 'step' },
  { id: 'e_a_of', source: 'agnieszka', target: 'ojciec_fl', type: 'step' },
  { id: 'e_of_f', source: 'ojciec_fl', target: 'franciszek', type: 'step' },
  { id: 'e_of_l', source: 'ojciec_fl', target: 'leon', type: 'step' },
  
  { id: 'e_f_z1', source: 'franciszek', target: 'f_zona_1', type: 'step' },
  { id: 'e_f_z2', source: 'franciszek', target: 'f_zona_2', type: 'step' },
  { id: 'e_f_z3', source: 'franciszek', target: 'f_zona_3', type: 'step' },
  
  { id: 'e_z2_m', source: 'f_zona_2', target: 'marian', type: 'step' },
  { id: 'e_z2_h', source: 'f_zona_2', target: 'henryk', type: 'step' },
  { id: 'e_z2_k', source: 'f_zona_2', target: 'kazik', type: 'step' },
  { id: 'e_z2_b', source: 'f_zona_2', target: 'bolek', type: 'step' },
  { id: 'e_z3_w', source: 'f_zona_3', target: 'wiesia_f', type: 'step' },
  { id: 'e_w_t', source: 'wiesia_f', target: 'tomek', type: 'step' },
  
  { id: 'e_l_j', source: 'leon', target: 'jasiek', type: 'step' },
  { id: 'e_j_c1', source: 'jasiek', target: 'corka_j_1', type: 'step' },
  { id: 'e_j_c2', source: 'jasiek', target: 'corka_j_2', type: 'step' },
  { id: 'e_j_a', source: 'jasiek', target: 'andrzej_j', type: 'step' },
  
  { id: 'e_c1_r', source: 'corka_j_1', target: 'rafal', type: 'step' },
  { id: 'e_c2_m', source: 'corka_j_2', target: 'marzena_leon', type: 'step' },
  { id: 'e_a_t', source: 'andrzej_j', target: 'teresa', type: 'step' },

];
