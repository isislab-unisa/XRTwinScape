# XRTwinScape
The aim of XRTwinScape is to easily digitize a full environment by simply uploading a video.
This project uses the AI based technology of Gaussian Splatting to recreate an existing environment in high fidelity and provides a fully web-based application to manage the creation and publication of the desired reconstructions.

The full Gaussian Splatting pipeline developed consists of [Mast3r](https://github.com/naver/mast3r/tree/mast3r_sfm) for the SfM part and [Nerfstudio](https://github.com/nerfstudio-project/nerfstudio) for the reconstruction training.

The application provides both an editor for modifying and annotating the reconstruction, and a VR and web-based viewer for reconstructions exploration.

## XR2Learn
This XRTwinScape project has been funded through the XR2Learn [Open Call 2](https://xr2learn.eu/open-call-2-winners/).

<img src="images/XR2Learn%20Logo.png" alt="Logo XR2Learn" width="200"/>

XR2Learn is a Horizon Europe-funded initiative designed to foster the cross-border creation of human-centric extended reality (XR) applications for education. At its core, it will deliver a one-stop-shop Digital Innovation Hub platform that brings together XR technology providers, application designers, educators, developers, end-users, and decision-makers. This platform will streamline communication, collaboration, and matchmaking across the XR-based educational supply chain, with a special focus on immersive training in manufacturing and distance-learning contexts.

<img src="images/EU%20funded%20project.jpg" alt="Logo Funded By Europe" width="200"/>

## Prerequisites
The only requisite for running this project is an installation of Docker to run the containers.

## How to Run
To run this project just run the following command in the [twin_scape](./twin_scape/) folder

```
docker compose up -d
```

## Evaluation & Experimentation

The XRTwinScape pilot execution phase focused on validating the platform's technical stability and pedagogical effectiveness. The experimentation involved a total of **164 trainees** across three distinct use cases, utilizing a between-subjects design to compare Virtual Reality (VR) and Desktop modalities.

### Testing Sessions & Demographics

Testing was conducted between December 2025 and January 2026 with diverse user groups ranging from students to professionals.

| Use Case | Date(s) | Participants | Target Audience & Demographics |
| :--- | :--- | :--- | :--- |
| **UC1: Industrial Training** | 09.12.2025 | **32** | Students & Unemployed (100% Male, 50% foreign nationals). |
| **UC2: Problem Solving** | 13.01.2026 | **37** | Employees & Professionals (60% Male, 40% Female). |
| **UC3: Career Guidance** | 02.12.2025 & 07.01.2026 | **95** | High School Students (4th/5th year; 80% Male, 20% Female). |

### Lessons & Data

Below are the links to the web-player versions of the lessons used during the validation, along with the data collection instruments and raw results.

#### Use Case 1: Industrial Plant Engineering
* **[Web Lesson](https://xrtwinscape.di.unisa.it/render_xrts_viewer/?title=eduwork1_3)**
* Learning evaluation questionnaire: [Questionnaire](https://drive.google.com/file/d/1oNVNRSAa-d6jneSTX2vJz4yhoRz7An_u/view?usp=drive_link), [Pre-activity Responses](https://docs.google.com/spreadsheets/d/1n2hRzGUHKyPECYzuS5GhvBU3Xl-UoCqHtO-7Myz1ohs/edit?gid=1998870935#gid=1998870935), [Post-activity Responses](https://docs.google.com/spreadsheets/d/1U9G3qyF7IRMboUE3OYNqmCMbSrD7uB7gyxXX1Mkn0f0/edit?gid=1310930315#gid=1310930315)
* Tool evaluation questionnaire: [Questionnaire](https://drive.google.com/file/d/1hKh0rsGUG_BoFinmu4t85fF2H0VggKmU/view?usp=drive_link), [Responses](https://docs.google.com/spreadsheets/d/1smQNXg0tMhbDTQRFjpZZu4DdlONyP7cwWeqHP62v320/edit?gid=1868212414#gid=1868212414)

#### Use Case 2: MV/LV Substation Problem Solving
* **[Web Lesson](https://xrtwinscape.di.unisa.it/render_xrts_viewer/?title=enellab2_4)**
* Post-activity questionnaire: [Questionnaire](https://drive.google.com/file/d/1rfPFmSASbuc58b8QA_E8YZMmlq8dE31G/view?usp=drive_link), [Responses](https://docs.google.com/spreadsheets/d/1pcQUP8ck5w5Lw524yp56vW_EQCjDhtotnE4YV7Jt6sY/edit?gid=1946154515#gid=1946154515)
* Tool evaluation questionnaire: [Questionnaire](https://drive.google.com/file/d/1hKh0rsGUG_BoFinmu4t85fF2H0VggKmU/view?usp=drive_link), [Responses](https://docs.google.com/spreadsheets/d/1w4mDxQUkM3_Ba68zrIVmgny3Q4ne84Ndk0el13f5Juo/edit?gid=314399499#gid=314399499)

#### Use Case 3: Industry 5.0 & Welding
* **[Web Lesson](https://xrtwinscape.di.unisa.it/render_xrts_viewer/?title=WeldingLab3_5)**
* Learning evaluation questionnaire: [Questionnaire](https://drive.google.com/file/d/1kGa-T0BkUhUWAFxnR34CXfiOMQNcGk7R/view?usp=drive_link), [Pre-activity Responses](https://docs.google.com/spreadsheets/d/1HE-eOefxo6j_WQMZeHOjt52UBieei2N37tfWCj46wJk/edit?gid=1549353039#gid=1549353039), [Post-activity Responses](https://docs.google.com/spreadsheets/d/1s0kjWPk1z8q8eb93tAhnC3Ees3g5hKqy4OSbbeDAKNI/edit?gid=1741228821#gid=1741228821)
* Tool evaluation questionnaire: [Questionnaire](https://drive.google.com/file/d/1hKh0rsGUG_BoFinmu4t85fF2H0VggKmU/view?usp=drive_link), [Responses (02.12.2025)](https://docs.google.com/spreadsheets/d/1dqlfXfcvxDRlVR4iz1drzfG2TpM7ZgdIAkyFQqE8e5s/edit?gid=1237042547#gid=1237042547), [Responses (07.01.2026)](https://docs.google.com/spreadsheets/d/1qYqtwUZiS-UgvNbwx5lH6L14JZcW_A1DVpGgQbhwRsg/edit?gid=1859801072#gid=1859801072)

### Results Considerations

The evaluation highlighted a clear advantage for the immersive VR modality over the desktop experience. Key findings from the analysis include:

* **Learning Effectiveness:** VR users demonstrated improved learning outcomes, with average assessment scores increasing from **5.10 to 5.46** (on a 9-point scale), whereas desktop users saw a slight decline in post-activity scores.
* **Usability:** The platform achieved an aggregated System Usability Scale (SUS) score of **68.55**, placing it in the "Good" usability range.
* **User Adoption:** Regardless of the complexity of the task (from career guidance to complex problem solving), the Behavioral Intention (BI) to use the system remained consistently high across all groups, with an aggregated mean of **4.47/5**.
* **Skill Application:** In the problem-solving use case, participants reported a high level of confidence and consistency in their decision-making processes (Self-assessment score: **3.73/5**, SD: 0.13).

## Third-Party Software
This work make use of the [Mast3r](https://github.com/naver/mast3r/tree/mast3r_sfm) project, 
Mast3r is distributed under the CC BY-NC-SA 4.0 License.
