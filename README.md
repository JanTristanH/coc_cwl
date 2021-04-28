# coc_cwl
compute internal cwl rankings for distributing league bonus. <br/>
The Highest ranked Player is sorted first in result file. Ranking is determined by net stars 
(defensive stars given to opponent - stars gained in attacks ) 

## prepartion
this is a work in progress
A table created by the sql script for attacks is expected to be present

## how to start
- clone this repository and run `npm install`
- put the desired clantag and your api Key along with the mariadb configuration in the .env file
- run `npm start`
- see the results in mariadb with a query or tool like matabase