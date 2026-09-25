# O-CEI Platform

The **O-CEI Platform** is a web-based monitoring and decision-support platform developed for port operations. It combines vessel information, port-call monitoring, energy consumption estimation, energy demand forecasting, and AI-assisted vessel detection within a unified dashboard.

The platform is designed to provide port operators with a clear overview of vessel activity and its associated energy requirements.

## Main Features

### Dashboard

The main Dashboard provides a consolidated overview of the current status of the port.

It presents key operational information such as vessels currently in port, port-call activity, estimated energy consumption, and other relevant indicators.

The purpose of this page is to allow operators to quickly understand the current operational and energy status of the port.

### Vessels

The **Vessels** section provides information about vessels registered or detected by the platform.

Vessel information can be used together with port-call data to identify vessels, monitor their activity, and support the calculation of estimated energy consumption.

### Port Calls

The **Port Calls** section monitors vessel arrivals, departures, and activity within the port area.

Vessel position information is used to determine the status of port calls and provide a geographical overview of vessel activity around the port.

The map interface allows operators to visualize vessel positions and monitor vessels associated with the port.

### Consumption

The **Consumption** page provides the energy-related functionality of the platform.

For each vessel and port call, the platform calculates an **estimated energy consumption** using vessel-specific parameters together with the duration of the port stay.

Historical consumption data can also be explored by selecting different periods through the calendar interface.

In addition, the platform estimates the corresponding **CO₂ emissions**, allowing operators to examine both energy demand and the environmental impact associated with vessel activity.

### Energy Demand Forecasting

The platform includes a machine-learning component for predicting future energy demand.

Users can select a future date range and generate an energy demand forecast based on the available operational and historical data.

The platform also allows operators to enter the **real energy consumption** associated with completed observations. These real measurements can be used as additional training data, allowing the forecasting model to improve as more operational data becomes available.

### Live Camera

The **Live Camera** section integrates the vessel classification component.

This section processes camera imagery using a YOLO-based computer vision pipeline to detect vessels within the monitored port area.

The detection process can identify vessels in camera frames and provide visual information that complements the vessel and port-call monitoring functionality of the platform.

## Platform Workflow

The main workflow of the O-CEI Platform can be summarized as:

**Vessel Activity → Port Call Monitoring → Energy Consumption Estimation → CO₂ Estimation → Energy Demand Forecasting**

Camera-based vessel classification through **Live Camera** provides an additional source of information for monitoring activity within the port.

## Technologies

The O-CEI Platform combines several technologies and components, including:

- React-based web dashboard
- Node.js backend services
- Vessel and port-call data processing
- AIS-based vessel information
- Machine-learning energy demand forecasting
- YOLO-based vessel detection
- Database storage for vessel, port-call, consumption, and operational data

## Purpose

The objective of the O-CEI Platform is to demonstrate how vessel monitoring, energy estimation, machine learning, and computer vision can be integrated into a single environment to support smarter and more energy-aware port operations.

## Project Structure

The platform is divided into multiple functional components covering the user interface, vessel monitoring, port-call management, energy analysis, forecasting, and vessel detection.

Additional technical documentation for individual components can be provided separately where required.

## License

The O-CEI Platform was developed as part of the O-CEI project. Licensing information for the platform and its individual components is provided separately where applicable.
