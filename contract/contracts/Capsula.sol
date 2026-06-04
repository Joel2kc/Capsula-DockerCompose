// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.28;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract Capsula is ERC721, ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    // Struct to store capsule data
    struct CapsuleData {
        uint256 unlockTimestamp; // When the capsule unlocks
        string encryptedPrivateMetadataHash; // Encrypted hash of private metadata
        bool exists; // Whether this token exists
    }

    // Mapping from token ID to capsule data
    mapping(uint256 => CapsuleData) private _capsuleData;

    // Events
    event CapsuleMinted(
        uint256 indexed tokenId,
        address indexed owner,
        uint256 unlockTimestamp,
        string publicMetadataURI,
        string encryptedPrivateMetadataHash
    );

    event PrivateMetadataAccessed(
        uint256 indexed tokenId,
        address indexed requester,
        bool isOwner
    );

    constructor(
        address initialOwner
    ) ERC721("Capsula", "CAPSULA") Ownable(initialOwner) {}

    /**
     * @dev Mint a new capsule with both public and private metadata
     * @param to The address to mint the token to
     * @param publicMetadataURI The public NFT metadata URI (standard NFT metadata)
     * @param unlockTimestamp When the capsule unlocks (Unix timestamp)
     * @param encryptedPrivateMetadataHash The encrypted hash of private metadata
     * @return tokenId The ID of the minted token
     */
    function safeMint(
        address to,
        string memory publicMetadataURI,
        uint256 unlockTimestamp,
        string memory encryptedPrivateMetadataHash
    ) public onlyOwner returns (uint256) {
        uint256 tokenId = _nextTokenId++;

        // Mint the token
        _safeMint(to, tokenId);

        // Set the public metadata URI
        _setTokenURI(tokenId, publicMetadataURI);

        // Store capsule-specific data
        _capsuleData[tokenId] = CapsuleData({
            unlockTimestamp: unlockTimestamp,
            encryptedPrivateMetadataHash: encryptedPrivateMetadataHash,
            exists: true
        });

        emit CapsuleMinted(
            tokenId,
            to,
            unlockTimestamp,
            publicMetadataURI,
            encryptedPrivateMetadataHash
        );

        return tokenId;
    }

    /**
     * @dev Get the encrypted private metadata hash for a token
     * @dev Only the token owner can access this
     * @param tokenId The token ID
     * @return The encrypted private metadata hash
     */
    function getPrivateMetadataHash(
        uint256 tokenId
    ) public returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        require(
            ownerOf(tokenId) == msg.sender,
            "Only token owner can access private metadata"
        );

        emit PrivateMetadataAccessed(tokenId, msg.sender, true);

        return _capsuleData[tokenId].encryptedPrivateMetadataHash;
    }

    /**
     * @dev Get the unlock timestamp for a token
     * @param tokenId The token ID
     * @return The unlock timestamp
     */
    function getUnlockTimestamp(uint256 tokenId) public view returns (uint256) {
        require(_exists(tokenId), "Token does not exist");
        return _capsuleData[tokenId].unlockTimestamp;
    }

    /**
     * @dev Check if a capsule is unlocked
     * @param tokenId The token ID
     * @return True if the capsule is unlocked
     */
    function isUnlocked(uint256 tokenId) public view returns (bool) {
        require(_exists(tokenId), "Token does not exist");
        return block.timestamp >= _capsuleData[tokenId].unlockTimestamp;
    }

    /**
     * @dev Get comprehensive capsule information
     * @param tokenId The token ID
     * @return owner The token owner
     * @return publicMetadataURI The public metadata URI
     * @return unlockTimestamp The unlock timestamp
     * @return unlocked Whether the capsule is unlocked
     * @return hasPrivateMetadata Whether private metadata exists
     */
    function getCapsuleInfo(
        uint256 tokenId
    )
        public
        view
        returns (
            address owner,
            string memory publicMetadataURI,
            uint256 unlockTimestamp,
            bool unlocked,
            bool hasPrivateMetadata
        )
    {
        require(_exists(tokenId), "Token does not exist");

        return (
            ownerOf(tokenId),
            tokenURI(tokenId),
            _capsuleData[tokenId].unlockTimestamp,
            block.timestamp >= _capsuleData[tokenId].unlockTimestamp,
            bytes(_capsuleData[tokenId].encryptedPrivateMetadataHash).length > 0
        );
    }

    /**
     * @dev Override _exists to check our custom existence flag
     */
    function _exists(uint256 tokenId) internal view returns (bool) {
        return _capsuleData[tokenId].exists;
    }

    // The following functions are overrides required by Solidity.
    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        return ERC721URIStorage.tokenURI(tokenId);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
