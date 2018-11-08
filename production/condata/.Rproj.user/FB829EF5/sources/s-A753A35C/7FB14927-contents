# Script for combining data for Parliamentary constituencies on:
# - Population by age 
# - Party of MP
# - City and town classification
# Author: Oliver Hawkins

# Imports --------------------------------------------------------------------

library(tidyverse)

# Functions ------------------------------------------------------------------
get_median_age <- function(row) {
    ages <- 0:90
    median(rep(ages, row))
}

# Analysis -------------------------------------------------------------------

# Get population data
popdata <- read_csv("data/WPC-MYPE-SY-2017.csv")
colnames(popdata) <- c(
    "pcon11cd", 
    "pcon11nm", 
    "total", 
    paste0("a", 0:90))
popdata$median_age <- popdata[, 4:94] %>% apply(1, get_median_age)
# popdata$median_age <- popdata[, 4:94] %>% pmap_dbl(~get_median_age(c(...)))
popdata <- popdata %>% 
    select(pcon11cd, pcon11nm, total, median_age)

# Get MP parties
gedata <- read_csv("data/HoC-GE2017-results-updated.csv")
gedata$turnout <- gedata$valid_votes / gedata$electorate
gedata <- gedata %>% 
    select(ons_id, region_name, first_party, majority, turnout)

# Get city and town classification data
citdata <- read_csv("data/pcon-classification.csv")
citdata <- citdata %>% 
    group_by(constituency_code) %>%
    filter(percent_of_constituency == max(percent_of_constituency)) %>%
    select(constituency_code, classification)

# Combine data
data <- left_join(popdata, gedata, by = c("pcon11cd" = "ons_id"))
data <- left_join(data, citdata, by = c("pcon11cd" = "constituency_code"))
colnames(data) <- c(
    "code", 
    "constituency", 
    "population", 
    "median_age",
    "region",
    "party", 
    "majority",
    "turnout",
    "classification")
data <- data %>% select(
    "code", 
    "constituency",
    "region", 
    "population", 
    "median_age",
    "party",
    "majority",
    "turnout",
    "classification")
write_csv(data, "constituencies.csv")