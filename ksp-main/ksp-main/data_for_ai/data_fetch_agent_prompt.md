# AGENT TASK: Data Acquisition for KSP Sentinel Platform

## YOUR ROLE
You are a data acquisition agent. Your sole job is to find, validate, and provide direct download links for the datasets listed below. Do NOT summarize or analyze the data. Do NOT skip any dataset category. For each dataset found, return: the exact download URL, the portal name, the file format, estimated row count or record scope, and a one-line description of what it contains.

## CONTEXT
This is for the Karnataka State Police (KSP) Sentinel AI platform. The existing database only has aggregated monthly crime category counts (Month, Year, Crime_Category, Subcategory, Cases). Four critical data entities are entirely missing. You must locate downloadable datasets for each of the four missing entities listed below. Prefer Karnataka-specific data. If Karnataka-specific is unavailable, accept India-national data that includes Karnataka as a filterable dimension. All files must be in CSV, Excel (.xlsx), JSON, or PDF-with-tables format.

## PRIORITY PORTALS TO SEARCH (IN THIS ORDER)

1. https://data.gov.in — India's official Open Government Data platform. Search using the search bar. Filter by: State = Karnataka, Format = CSV or XLS.
2. https://ncrb.gov.in — National Crime Records Bureau. Navigate to: Publications > Crime in India > Annual Reports (2019-2023). Look for downloadable Excel/CSV tables in appendices.
3. https://ksp.gov.in — Karnataka State Police official portal. Check for open data, annual reports, or statistics sections.
4. https://scrb.kar.nic.in — Karnataka SCRB. Look for district-wise or station-wise crime statistics.
5. https://www.kaggle.com/datasets — Search: "India crime statistics Karnataka", "India crime accused demographics", "Karnataka police crime data".
6. https://www.mha.gov.in — Ministry of Home Affairs. Check Annual Reports and Crime Statistics publications.
7. https://cybercrime.gov.in — National Cybercrime Reporting Portal. Check for public statistics or reports.
8. https://i4c.mha.gov.in — Indian Cybercrime Coordination Centre. Check for downloadable cybercrime trend reports.
9. https://mospi.gov.in — Ministry of Statistics. For demographic/socioeconomic datasets linked to crime.
10. https://censusindia.gov.in — Census 2011 district-level demographic tables.

---

## DATASET 1: Station-Level Crime Data

### Why Needed
Current database has NO police station dimension. The problem statement requires data from 1100+ police stations across Karnataka. Station-level granularity is required for hotspot detection, inter-station comparison, and divisional reporting.

### Exact Schema Required
Each record must contain AT MINIMUM:
- police_station_name (string)
- district (string)
- crime_category (string)
- cases_reported (integer)
- year (integer)

Bonus if available:
- cases_chargesheeted (integer)
- cases_pending (integer)
- division (string: Bengaluru / Mysuru / Belagavi / Kalaburagi)

### Search Queries to Use
- data.gov.in search: "Karnataka police station crime"
- data.gov.in search: "station-wise crime Karnataka"
- NCRB Crime in India: Table 1.1 (State/UT-wise and District-wise) + Table 2 appendices
- NCRB Crime in India: "Police Station-wise" in any appendix tables
- Kaggle search: "Karnataka police station crime dataset"
- Google search: site:data.gov.in "police station" "Karnataka" filetype:csv OR filetype:xlsx

### Acceptable Substitutes
If station-level data is unavailable: Accept district-level data for Karnataka (30 districts) with the same schema minus police_station_name. District must be a column, not just a filename.

### Output Format Required
```
Dataset Name: [name]
Download URL: [direct URL to CSV/XLS file, NOT a webpage]
Portal: [portal name]
Format: [CSV / Excel / PDF]
Scope: [years covered, geographic scope]
Columns Present: [list key columns found]
Row Count: [approximate]
Relevance Score: HIGH / MEDIUM / LOW
Notes: [anything unusual about the data structure]
```

---

## DATASET 2: Accused & Victim Socio-Demographic Data

### Why Needed
Current database has zero demographic information. Problem statement requires socio-demographic insights (age, gender, occupation, economic background of accused and victims). This is needed for behavioral profiling and demographic crime pattern analysis.

### Exact Schema Required
Each record must contain AT MINIMUM:
- age_group (string: e.g., "18-30", "30-45") OR age (integer)
- gender (string: Male / Female / Other)
- crime_category (string)
- role (string: Accused / Victim)
- year (integer)
- state_or_district (string)

Bonus if available:
- occupation (string)
- education_level (string)
- economic_status (string)
- caste_category (string: SC / ST / OBC / General)

### Search Queries to Use
- NCRB Crime in India Reports: Tables titled "Age-group and Sex-wise Distribution of Accused" and "Victims of Cognizable Crimes"
  - Direct NCRB path: ncrb.gov.in > Publications > Crime in India > 2022 or 2023 > Download tables
  - Specifically look for: Chapter 3 (Offenders) and Chapter 2 (Victims) in the annual statistical appendices
- data.gov.in search: "accused age sex crime India"
- data.gov.in search: "victim demographics crime Karnataka"
- Kaggle search: "India crime accused demographics gender age"
- Google search: site:ncrb.gov.in "accused" "age" "gender" filetype:xlsx OR filetype:xls

### Acceptable Substitutes
National-level (all India) data with state as a filterable column is acceptable if Karnataka-specific is not available.

### Output Format Required
Same as Dataset 1 output format above.

---

## DATASET 3: Financial Fraud / Cybercrime Transaction Data (Money Mule Trails)

### Why Needed
Current mule trail visualization uses 3-node hardcoded mock data (Rajesh → Kavita → Amit). The problem statement requires criminal network analysis with real financial transaction patterns. Need data that shows fund flow patterns, account-to-account transfers, UPI fraud chains, or cybercrime financial trails.

### Exact Schema Required
Each record must contain AT MINIMUM — Option A (Transaction Level):
- transaction_id OR case_id (string)
- sender_type (string: individual / business / unknown)
- receiver_type (string)
- amount (number)
- transaction_method (string: UPI / NEFT / Cash / Hawala)
- crime_type (string: Cyber Fraud / Money Laundering / Hawala / etc.)
- year (integer)

OR Option B (Aggregated Cybercrime Financial Data):
- crime_type (string)
- total_cases (integer)
- total_financial_loss_inr (number)
- year (integer)
- state_or_district (string)

### Search Queries to Use
- cybercrime.gov.in: Look for annual reports or statistics pages with downloadable data
- i4c.mha.gov.in: Check publications section for cybercrime trend data
- data.gov.in search: "cyber crime financial fraud India"
- data.gov.in search: "UPI fraud cases"
- data.gov.in search: "online financial fraud Karnataka"
- NCRB Crime in India: Chapter on Cyber Crimes (usually Chapter 7 or 9) — look for financial loss tables
- RBI Annual Report: Payment Systems statistics (not crime-specific but shows UPI transaction volumes)
  URL: https://www.rbi.org.in/Scripts/AnnualReportPublications.aspx
- Kaggle search: "India cybercrime dataset UPI fraud money laundering"
- Google search: "Karnataka cybercrime financial fraud dataset" filetype:csv OR filetype:xlsx

### Acceptable Substitutes
Aggregated national cybercrime financial loss data by crime type and year is acceptable. Synthetic/anonymized transaction datasets from research papers are acceptable if they are clearly labeled as synthetic and follow realistic patterns.

### Output Format Required
Same as Dataset 1 output format above.

---

## DATASET 4: Karnataka District-Level Demographic & Socioeconomic Data

### Why Needed
Problem statement requires socio-demographic insights correlating crime with population characteristics. Need district-level population, literacy, unemployment, and poverty data to build correlation features for the crime prediction model.

### Exact Schema Required
Each record must contain AT MINIMUM:
- district (string: one of Karnataka's 30 districts)
- population (integer)
- literacy_rate (float: 0-100)
- urban_rural_ratio (float) OR urban_population (integer)
- year OR census_year (integer)

Bonus if available:
- unemployment_rate (float)
- poverty_headcount_ratio (float)
- sex_ratio (integer: females per 1000 males)
- scheduled_caste_population (integer)
- scheduled_tribe_population (integer)

### Search Queries to Use
- censusindia.gov.in: District Census Handbook Karnataka 2011
  Direct URL to check: https://censusindia.gov.in/nada/index.php/catalog
- mospi.gov.in: District-level socioeconomic indicators
- data.gov.in search: "Karnataka district demographics census"
- data.gov.in search: "Karnataka district population literacy"
- Karnataka government data portal: https://dpal.karnataka.gov.in
- Kaggle search: "India district demographics census 2011"
- Google search: "Karnataka district census 2011 dataset" filetype:csv OR filetype:xlsx
- IndiaStats or DevDataLab: https://www.devdatalab.org/shrug (SHRUG dataset has India district-level data)

### Acceptable Substitutes
Census 2011 data is acceptable even though it is older — it provides the district demographic baseline needed for correlation. If 2011 census tables are only in PDF format, note the PDF URL and table number — the receiving agent will extract tables from PDFs separately.

### Output Format Required
Same as Dataset 1 output format above.

---

## DATASET 5: Indian Legal Statutes & IPC / BNS / CrPC / BNSS Sections

### Why Needed
The chatbot must be able to answer investigator questions such as:
- "Under which section does robbery fall?"
- "What is the punishment for POCSO offences?"
- "What is the difference between IPC 302 and IPC 304?"
- "Which BNS section replaced IPC 420?"
- "What does Section 65B of the IT Act say about electronic evidence?"

The chatbot needs a structured, machine-readable reference of all relevant Indian criminal laws, their section numbers, offence descriptions, punishments, and the new BNS/BNSS equivalents (since the new criminal codes came into effect from July 1, 2024).

### Laws to Fetch (in priority order)

1. **BNS — Bharatiya Nyaya Sanhita, 2023** (replaced IPC from July 1, 2024)
   - Full text with section numbers, offence titles, punishment details
   - IPC-to-BNS mapping table (old section → new section)

2. **IPC — Indian Penal Code, 1860** (still referenced in older FIRs and case files)
   - All sections with offence name and punishment

3. **BNSS — Bharatiya Nagarik Suraksha Sanhita, 2023** (replaced CrPC)
   - Procedure sections relevant to FIR, arrest, bail, investigation

4. **CrPC — Code of Criminal Procedure, 1973** (still referenced in older cases)
   - Key sections: 154 (FIR), 161 (witness statement), 41 (arrest), 167 (remand)

5. **IT Act, 2000 (with amendments)**
   - Sections: 43, 65, 66, 66A, 66B, 66C, 66D, 66E, 67, 72, 79
   - Section 65B (electronic evidence admissibility) — critical for cyber FIRs

6. **POCSO Act, 2012** (Protection of Children from Sexual Offences)
   - All sections with offence descriptions and punishments

7. **NDPS Act, 1985** (Narcotic Drugs & Psychotropic Substances)
   - Key sections: 8, 15, 17, 20, 21, 22, 27, 37 (bail conditions)

8. **SC/ST Prevention of Atrocities Act, 1989**
   - Offence descriptions and cognizable offence list

9. **Karnataka Police Act, 1963**
   - Sections relevant to station operations, officer powers, public order
   - URL to check: https://ksp.gov.in or https://dpal.karnataka.gov.in

10. **Domestic Violence Act, 2005** (Protection of Women from Domestic Violence)
    - Offence definitions and FIR filing provisions

### Exact Schema Required
For structured CSV/JSON format:
```
law_name         | string  | e.g., "BNS" / "IPC" / "POCSO"
section_number   | string  | e.g., "302" / "103" / "4"
offence_title    | string  | e.g., "Murder" / "Robbery"
description      | string  | Full text of the section
punishment       | string  | Imprisonment term, fine, or both
cognizable       | boolean | Is it a cognizable offence (arrest without warrant)?
bailable         | boolean | Is it bailable?
court            | string  | Sessions Court / Magistrate / High Court
ipc_equivalent   | string  | If BNS: corresponding old IPC section (or vice versa)
keywords         | string  | Comma-separated tags for search (e.g., "murder, homicide, death")
```

### Search Queries to Use
- **indiacode.nic.in** — Official Indian law repository
  - Direct search: https://indiacode.nic.in
  - Search for: "Bharatiya Nyaya Sanhita 2023", "Indian Penal Code 1860", "IT Act 2000"
  - Look for downloadable PDF or XML versions of each Act
- **legislative.gov.in** — Ministry of Law & Justice
  - URL: https://legislative.gov.in/acts-of-parliament-from-1950
  - Filter: Criminal Law, IT Law
- **Kaggle search:** "IPC sections dataset", "Indian Penal Code CSV", "BNS IPC mapping"
- **GitHub search:** "IPC sections CSV", "Indian criminal law dataset", "BNS sections structured"
  - Many developers have structured IPC/BNS into CSV — verify source quality
- **data.gov.in search:** "Indian Penal Code sections", "criminal law India dataset"
- **Google search:** "IPC all sections CSV download filetype:csv"
- **Google search:** "BNS Bharatiya Nyaya Sanhita section list CSV OR JSON"
- **Google search:** "IPC to BNS mapping table CSV download"
- For IT Act 65B specifically: Search "Section 65B Indian Evidence Act electronic record" on indiacode.nic.in

### Acceptable Substitutes
- If structured CSV/JSON is unavailable, accept the official PDF from indiacode.nic.in — note exact Act name, year, and PDF download URL. The receiving pipeline will parse tables from the PDF.
- If only English text is available (no Kannada), that is acceptable — translation will be handled separately by Zia.
- GitHub repositories with structured law data are acceptable IF they cite the original official source.

### Output Format Required
Same as Dataset 1 output format. Additionally include:
```
Law Coverage: [list which Acts were found vs. not found]
IPC-BNS Mapping Available: YES / NO
Kannada Version Available: YES / NO
```

---

## DELIVERY FORMAT

Return your findings as a structured report with one section per dataset. Use this exact structure:

```
=== DATASET 1: Station-Level Crime Data ===

FOUND: YES / NO / PARTIAL

Link 1:
  Dataset Name:
  Download URL:
  Portal:
  Format:
  Scope:
  Columns Present:
  Row Count:
  Relevance Score:
  Notes:

Link 2: [if multiple found]
  ...

GAPS: [what is still missing even after best finds]

---

=== DATASET 2: Accused & Victim Socio-Demographic Data ===
[same structure]

---

=== DATASET 3: Financial Fraud / Cybercrime Transaction Data ===
[same structure]

---

=== DATASET 4: Karnataka District Demographics ===
[same structure]

---

=== DATASET 5: Indian Legal Statutes & IPC/BNS Sections ===
[same structure]

---

=== OVERALL SUMMARY ===
Datasets fully found: X/5
Datasets partially found: X/5
Datasets not found: X/5
Critical blockers: [list anything that is truly unavailable from open sources]
```

## HARD RULES

1. DO NOT provide links to portal homepages. Every URL must be a direct link to a downloadable file or a specific dataset page where a download button exists.
2. DO NOT fabricate or guess URLs. Only return URLs you have verified exist.
3. DO NOT return PDFs as the primary format unless no CSV/Excel alternative exists. If PDF is the only option, note the exact table numbers needed inside the PDF.
4. DO NOT aggregate or pre-process the data. Just find it and return the links.
5. If a dataset is genuinely unavailable from open sources, explicitly state: "NOT AVAILABLE FROM OPEN SOURCES" and suggest the closest alternative.
6. Prioritize data from 2019 onwards. Data older than 2015 is low priority unless no newer data exists.
7. If you find a Kaggle dataset, verify it was sourced from an official government source (check the dataset description and provenance). Note the source in your report.
