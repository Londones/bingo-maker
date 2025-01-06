import React from "react";

type CellContextMenuProps = {
    index: number;
};

const CellContextMenu = ({ index }: CellContextMenuProps) => {
    return <div>{index}</div>;
};

export default CellContextMenu;
