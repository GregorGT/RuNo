import { dialog } from "@tauri-apps/api";
import { NodeViewWrapper } from "@tiptap/react";
import React, { useEffect, useState } from "react";
//@ts-ignore
import math from "mathjs-expression-parser";
import { Input, Modal } from "antd";

export default (props: any) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formula, setFormula] = useState(props.node.attrs.formula);

  useEffect(() => {
    setFormula(props.node.attrs.formula);
  }, [props.node.attrs.formula]);

  const askFormula = () => {
    setIsModalOpen(true);
  };

  return (
    <>
      <Modal
        title="Enter Math Formula"
        open={isModalOpen}
        onOk={() => {
          props.updateAttributes({
            formula,
          });
          setIsModalOpen(false);
        }}
        onCancel={() => {
          setIsModalOpen(false);
        }}
      >
        <Input
          value={formula}
          onChange={(e) => {
            setFormula(e.target.value);
          }}
        />
      </Modal>
      <NodeViewWrapper className="math-component d-inline">
        <span
          onClick={askFormula}
          style={{
            backgroundColor: "gray",
            fontFamily: "monospace",
            color: "white",
          }}
          className="label"
        >
          &nbsp;
          {math.eval(props.node.attrs?.formula || "0")}
          &nbsp;
        </span>
      </NodeViewWrapper>
    </>
  );
};
