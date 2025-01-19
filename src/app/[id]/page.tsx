import React from "react";

type BingoPageProps = {
    id: string;
};

const BingoPage = ({ id }: BingoPageProps) => {
    return <div>{id}</div>;
};

export default BingoPage;
