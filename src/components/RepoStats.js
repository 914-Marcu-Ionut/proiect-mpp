import React from 'react';

const RepoStats = ({ data }) => {
    let highest = 0
    let lowest = 100
    let avearge = 0
    if(data.length !== 0){
        for (let i = 0; i < data.length; i++) {
            avearge += data[i].data.percent
            if(highest < data[i].data.percent){
                highest = data[i].data.percent
            }
            if(lowest > data[i].data.percent){
                lowest = data[i].data.percent
            }
        }
        avearge = avearge / data.length
    } else {
        highest = '0 elements'
        lowest = '0 elements'
        avearge = '0 elements'
    }
    return (
        <div className="stats">
            <p style={{color:"green"}} >Highest percent: {highest}</p>
            <p style={{color:"orange"}}>Average percent: {avearge}</p>
            <p style={{color:"red"}}>Lowest percent: {lowest}</p>
        </div>
    );
};

export default RepoStats;