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



## Third-Party Software
This work make use of the [Mast3r](https://github.com/naver/mast3r/tree/mast3r_sfm) project, 
Mast3r is distributed under the CC BY-NC-SA 4.0 License.
