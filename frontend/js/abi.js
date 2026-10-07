export const ABI = [
  "function owner() view returns (address)",
  "function getInstitution(address) view returns (tuple(uint8 status,string name,string domain,uint64 updatedAt))",
  "function institutionCount() view returns (uint256)",
  "function institutionList(uint256) view returns (address)",
  "function verify(bytes32) view returns (tuple(bool exists,bool revoked,bool issuerActive,address issuer,string issuerName,string issuerDomain,uint64 issuedAt,string kind))",
  "function requestAccess(string,string)",
  "function review(address,bool)",
  "function suspend(address)",
  "function issue(bytes32,string)",
  "function issueBatch(bytes32[],string)",
  "function revoke(bytes32)",
  "event Issued(bytes32 indexed docHash,address indexed issuer,string kind)"
];
